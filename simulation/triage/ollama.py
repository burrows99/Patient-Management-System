import json
from typing import Dict, Any, Optional, Tuple
import requests
from pathlib import Path
import logging
import time
import re
import os
from simulation.utils.io_utils import read_yaml
from simulation.common.paths import get_config_path
from simulation.utils.env_utils import get_ollama_settings

from .base import TriageSystem
from .manchester import ManchesterTriageSystem

logger = logging.getLogger(__name__)

class OllamaTriageAgent(TriageSystem):
    """Ollama-based triage agent that uses a local LLM for priority assignment."""
    
    def __init__(self, model_name: str = "phi:2.7b", base_url: str = "http://localhost:11434", disable_fallback: bool = True):
        """
        Initialize the Ollama triage agent.
        
        Args:
            model_name: Name of the Ollama model to use (e.g., 'mistral:7b-instruct')
            base_url: Base URL of the Ollama API server
        """
        # Load configuration and environment
        self.config = self._load_config()
        env = get_ollama_settings()
        # Precedence: ENV > constructor args > config > hardcoded default
        self.model_name = (env.get('model')
                           or model_name
                           or self.config.get('model_name', 'phi:2.7b'))
        self.base_url = (env.get('host')
                         or base_url
                         or self.config.get('base_url', 'http://localhost:11434'))
        self.mts = ManchesterTriageSystem()  # Fallback to MTS if allowed
        self._last_call_meta = {}
        # Optional JSONL telemetry path via env var configured in config
        telemetry_cfg = (self.config.get('telemetry') or {})
        telemetry_env = telemetry_cfg.get('path_env_var', 'OLLAMA_TELEMETRY_PATH')
        self.telemetry_path = (os.getenv(telemetry_env) if telemetry_cfg.get('enabled', True) else None)
        # Optional mock mode to generate synthetic model outputs for testing (env var name from config)
        mock_cfg = (self.config.get('mock') or {})
        mock_env = mock_cfg.get('env_var', 'OLLAMA_MOCK')
        # Values: 'cycle' (1..5 rotating), 'p1', 'p2', 'p3', 'p4', 'p5' (force a fixed)
        self.mock_mode = os.getenv(mock_env, '').strip().lower() or None
        self._mock_i = 0
        # Explanation detail: 'short'|'medium'|'long' via env or default
        self.expl_detail = os.getenv('OLLAMA_EXPLANATION_DETAIL', 'medium').strip().lower()
        if self.expl_detail not in ('short','medium','long'):
            self.expl_detail = 'medium'
        # Prompt and explanation target words from config
        prompt_cfg = (self.config.get('prompt') or {})
        self.prompt_template = prompt_cfg.get('template') or "{encounter_class} {reason_description} {patient_history}"
        self.expl_words_cfg = (prompt_cfg.get('explanation_words') or {"short": 18, "medium": 32, "long": 55})
        # Request options from config
        req_cfg = (self.config.get('request') or {})
        self.req_timeout = int(req_cfg.get('timeout_sec', 60))
        self.req_retries = int(req_cfg.get('retries', 3))
        self.req_options = (req_cfg.get('options') or {"temperature": 0.3, "top_p": 0.9, "num_predict": 120})
        # No heuristics: the model fully decides priority
        self._last_service_min: Optional[float] = None
        
    def _build_prompt(self, encounter_data: Dict[str, Any]) -> Tuple[str, str, str]:
        """Build the model prompt from encounter data.

        Returns: (prompt, enc_class, reason)
        """
        reason = encounter_data.get('reason_description', '')
        enc_class = encounter_data.get('encounter_class', '')
        if not reason or len(reason.strip()) < 5:
            logger.warning("Reason too short; proceeding with LLM and logging telemetry")
        history = encounter_data.get('patient_history', '') or ''
        target_words = int(self.expl_words_cfg.get(self.expl_detail, 32))
        prompt = self.prompt_template.format(
            encounter_class=enc_class,
            reason_description=reason,
            patient_history=history,
            explanation_words=target_words,
        )
        return prompt, enc_class, reason

    def _build_payload(self, prompt: str) -> Dict[str, Any]:
        return {
            "model": self.model_name,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": self.req_options,
        }

    def _http_generate(self, payload: Dict[str, Any]) -> tuple[Any, int]:
        """Call Ollama /api/generate and return (result_json, http_ms)."""
        t0 = time.time()
        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.req_timeout,
        )
        response.raise_for_status()
        result = response.json()
        http_ms = int((time.time() - t0) * 1000)
        return result, http_ms

    def _extract_text_from_result(self, result: Any, http_ms: int) -> Optional[str]:
        """Normalize Ollama response: return text to parse, or None if already JSON/dict."""
        if isinstance(result, dict) and 'response' in result:
            return result['response'].strip()
        if isinstance(result, str):
            return result.strip()
        # Already parsed JSON from model
        self._last_call_meta = {"http_ms": http_ms, "parse": "pre-parsed", "raw_len": len(str(result))}
        logger.debug(f"Ollama call ok model={self.model_name} http_ms={http_ms} parse=pre-parsed size={len(str(result))}")
        return None

    def _extract_service_min_value(self, response: Dict[str, Any]) -> Optional[float]:
        """Extract a service time in minutes from model response if present.
        Accept keys like 'service_min', 'service_time_min', or 'service_minutes'.
        """
        if not isinstance(response, dict):
            return None
        for k in ("service_min", "service_time_min", "service_minutes"):
            if k in response:
                try:
                    v = response[k]
                    # Allow numeric or numeric string
                    num = float(str(v).strip().strip('"').strip("'"))
                    if num > 0:
                        return num
                except Exception:
                    continue
        return None

    def _extract_priority_value(self, response: Dict[str, Any]) -> Optional[int]:
        """Extract an int priority 1..5 from model response dict."""
        val = response.get('priority') if isinstance(response, dict) else None
        try:
            if isinstance(val, (int, float, str)):
                num = int(str(val).strip().strip('"').strip("'"))
                if 1 <= num <= 5:
                    return num
        except Exception:
            return None
        return None

    

    def _parse_obj(self, s: str):
        """Strict JSON parse only. Returns None on failure."""
        try:
            return json.loads(s)
        except Exception:
            return None

    def _normalize_dict(self, obj: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize keys to strings and coerce priority to int when possible."""
        norm: Dict[str, Any] = {}
        for k, v in obj.items():
            nk = str(k).strip().strip('"').strip("'")
            norm[nk] = v
        if 'priority' in norm and isinstance(norm['priority'], str):
            m = re.search(r"[1-5]", norm['priority'])
            if m:
                norm['priority'] = int(m.group(0))
        return norm

    def _parse_with_strategies(self, text: str, *, http_ms: int) -> Dict[str, Any]:
        """Parse using strict JSON, then one extra layer: JSON-substring parse. Raise on failure."""
        # 1) Primary parse
        obj = self._parse_obj(text)
        if obj is not None:
            if isinstance(obj, dict):
                norm = self._normalize_dict(obj)
                self._last_call_meta = {"http_ms": http_ms, "parse": "direct", "raw_len": len(text)}
                return norm
            # Non-dict object parsed; return as-is
            self._last_call_meta = {"http_ms": http_ms, "parse": "pre-parsed", "raw_len": len(str(obj))}
            return obj

        # 2) JSON substring parse
        match = re.search(r"\{[\s\S]*?\}", text)
        if match:
            sub = match.group(0)
            obj = self._parse_obj(sub)
            if obj is not None:
                if isinstance(obj, dict):
                    norm = self._normalize_dict(obj)
                    self._last_call_meta = {"http_ms": http_ms, "parse": "json-substring", "raw_len": len(sub)}
                    return norm
                self._last_call_meta = {"http_ms": http_ms, "parse": "pre-parsed", "raw_len": len(str(obj))}
                return obj

        # Fail
        self._last_call_meta = {"http_ms": http_ms, "parse": "parse-failed", "raw_len": len(text), "raw_text_sample": text[:300]}
        logger.error(f"Failed to parse Ollama response as JSON: {text}")
        raise ValueError("Ollama response parse failure")

    def _call_ollama(self, prompt: str) -> Dict[str, Any]:
        """Make a request to the local Ollama API with simple retries and robust parsing."""
        # Mock mode short-circuit for testing variety without server dependency
        if self.mock_mode:
            pr_map = {'p1': 1, 'p2': 2, 'p3': 3, 'p4': 4, 'p5': 5}
            if self.mock_mode in pr_map:
                prio = pr_map[self.mock_mode]
            else:
                prio = [1, 2, 3, 4, 5][self._mock_i % 5]
                self._mock_i += 1
            self._last_call_meta = {"http_ms": None, "parse": "mock", "raw_len": 0}
            return {"priority": prio, "explanation": f"mock:{self.mock_mode or 'cycle'}"}

        payload = {
            "model": self.model_name,
            "prompt": prompt,
            # Request strict JSON format from server
            "format": "json",
            "stream": False,
            # Balanced variety with guardrails; reduce verbosity
            "options": self.req_options,
        }

        last_error = None
        for attempt in range(self.req_retries):
            try:
                result, http_ms = self._http_generate(payload)

                # Extract text if needed
                text = self._extract_text_from_result(result, http_ms)
                if text is None:
                    return result

                logger.debug(f"Raw Ollama text: {text}")
                return self._parse_with_strategies(text, http_ms=http_ms)

            except Exception as e:
                last_error = e
                # Try to capture HTTP context if available
                err_body = None
                status = None
                try:
                    if 'response' in dir(e) and getattr(e, 'response') is not None:
                        status = getattr(e.response, 'status_code', None)
                        try:
                            err_body = e.response.text
                        except Exception:
                            err_body = None
                except Exception:
                    pass
                self._last_call_meta = {"http_ms": None, "parse": "error", "raw_len": 0, "error": str(e), "status": status, "body": (err_body[:300] if isinstance(err_body, str) else None)}
                logger.error(f"Error calling Ollama API (attempt {attempt+1}/3): {e} status={status} body={(err_body[:200] + '...') if isinstance(err_body, str) and len(err_body) > 200 else err_body}")
                # Exponential backoff with cap
                time.sleep(min(2 ** attempt, 4))

        # After retries, surface the error so caller can fall back to MTS
        raise RuntimeError(f"Ollama API failed after retries: {last_error}")
    
    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """
        Assign a priority level using the Ollama model.
        Falls back to MTS if the model is unavailable.
        """
        prompt, enc_class, reason = self._build_prompt(encounter_data)
        
        # Start timing before attempting any model/heuristic work
        overall_t0 = time.time()
        try:
            # Get response from Ollama
            response = self._call_ollama(prompt)
            
            # Validate and return priority (with heuristics if needed)
            priority = self._extract_priority_value(response)
            # Capture optional service_min estimate from model for follow-up use
            self._last_service_min = self._extract_service_min_value(response)

            # If invalid priority, treat as a failure and fall back to MTS
            if not isinstance(priority, int) or not (1 <= priority <= 5):
                raise ValueError("Invalid or missing priority from Ollama")

            # No post-processing heuristics; use model's priority as final

            total_ms = int((time.time() - overall_t0) * 1000)
            logger.debug(f"Ollama triage result: priority={priority} model={self.model_name} total_ms={total_ms} response={response}")

            # Optional JSONL telemetry (success path)
            self._write_telemetry(
                enc_class=enc_class,
                reason=reason,
                response=response if isinstance(response, dict) else None,
                priority_final=priority,
                total_ms=total_ms,
                error=None,
            )
            return priority
            
        except Exception as e:
            logger.error(f"Error in Ollama triage: {e}")
            # Always fall back to Manchester Triage on any failure
            final_priority = self.mts.assign_priority(encounter_data)
            # Reset last service estimate on failure path
            self._last_service_min = None
            # Write error-path telemetry as well
            total_ms = int((time.time() - overall_t0) * 1000)
            self._write_telemetry(
                enc_class=enc_class,
                reason=reason,
                response=None,
                priority_final=final_priority,
                total_ms=total_ms,
                error=str(e),
            )

            return final_priority
    
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """Delegate to base class implementation backed by shared config."""
        return super().get_priority_info(priority)

    def estimate_service_min(self, encounter_data: Dict[str, Any], priority: int) -> Optional[float]:
        """Return model-provided service time if available; otherwise fall back to MTS defaults."""
        if self._last_service_min is not None:
            return self._last_service_min
        # Fallback to Manchester Triage System standards
        try:
            return ManchesterTriageSystem().estimate_service_min(encounter_data, priority)
        except Exception:
            return None

    def _load_config(self) -> Dict[str, Any]:
        """Load Ollama configuration from centralized config using get_config_path."""
        cfg_path = get_config_path('ollama_config.yaml')
        if cfg_path.exists():
            try:
                return read_yaml(cfg_path) or {}
            except Exception as e:
                logger.error(f"Failed to read Ollama config at {cfg_path}: {e}")
        return {}

    def _write_telemetry(
        self,
        *,
        enc_class: str,
        reason: str,
        response: Optional[Dict[str, Any]],
        priority_final: Optional[int],
        total_ms: Optional[int],
        error: Optional[str],
    ) -> None:
        """Append a JSONL telemetry record if telemetry is enabled.

        Ensures the parent directory exists and tolerates any write errors.
        """
        if not self.telemetry_path:
            return
        try:
            meta = self._last_call_meta or {}
            # Capture model explanation if present in response
            explanation_text = response.get('explanation') if isinstance(response, dict) else None
            # Ensure directory exists
            try:
                p = Path(self.telemetry_path)
                if p.parent:
                    p.parent.mkdir(parents=True, exist_ok=True)
            except Exception:
                pass
            # Minimal, Ollama-aligned telemetry payload
            record = {
                "ts": int(time.time() * 1000),
                "model": self.model_name,
                "encounter_class": enc_class,
                "reason": reason,
                "priority_model": (response.get('priority') if isinstance(response, dict) else None),
                "priority_final": priority_final,
                "service_min_model": (response.get('service_min') if isinstance(response, dict) else None),
                "http_ms": meta.get('http_ms'),
                "total_ms": total_ms,
                "parse": meta.get('parse'),
                "error": error or meta.get('error'),
                "explanation": explanation_text,
            }
            with open(self.telemetry_path, 'a') as f:
                f.write(json.dumps(record) + "\n")
        except Exception as ex:
            logger.error(f"Failed to write Ollama telemetry: {ex}")
