import json
from typing import Dict, Any
import ast
import requests
from pathlib import Path
import logging
import time
import re
import os

from .base_triage import TriageSystem
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
        self.model_name = model_name
        self.base_url = base_url
        self.disable_fallback = disable_fallback
        self.mts = ManchesterTriageSystem()  # Fallback to MTS if allowed
        self._last_call_meta = {}
        # Optional JSONL telemetry path via env var
        self.telemetry_path = os.getenv('OLLAMA_TELEMETRY_PATH')
        # Optional mock mode to generate synthetic model outputs for testing
        # Values: 'cycle' (1..5 rotating), 'p1', 'p2', 'p3', 'p4', 'p5' (force a fixed)
        self.mock_mode = os.getenv('OLLAMA_MOCK', '').strip().lower() or None
        self._mock_i = 0
        # Explanation detail: 'short'|'medium'|'long' via env or default
        self.expl_detail = os.getenv('OLLAMA_EXPLANATION_DETAIL', 'medium').strip().lower()
        if self.expl_detail not in ('short','medium','long'):
            self.expl_detail = 'medium'
        self.prompt_template = (
        """
        You are a triage assistant using the Manchester Triage System (MTS).
        Assign a priority level from 1 (Red) to 5 (Blue) for the patient based on the encounter details.
        Only return a JSON object with fields 'priority' and 'explanation'. Do NOT include code blocks, backticks, or any extra prose.
        1. Immediate (life-threatening) - requires immediate medical attention
        2. Very Urgent - condition could deteriorate quickly
        3. Urgent - serious but stable condition
        4. Standard - needs assessment but not immediately urgent
        5. Non-urgent - can wait for assessment

        Patient Information:
        Encounter Type: {encounter_class}
        Reason for Visit: {reason_description}
        Patient History (recent): {patient_history}

        Guidance:
        - Consider MTS categories realistically; do not default to 3.
        - Use priority 1 ONLY when immediate life-threatening cues are present (e.g., not breathing, no pulse, unresponsive, cardiac arrest, seizure ongoing, severe respiratory distress).
        - For minor illnesses (e.g., sore throat, cold, runny nose) prefer 4. For administrative issues (e.g., prescription refill, paperwork) prefer 5.
        - In the explanation, explicitly mention up to 3 concrete factors from the reason/history that justify the chosen priority.
        - Aim for an explanation length of {explanation_words} words.
        - Examples:
          {{"priority":1,"explanation":"<explanation>"}}
          {{"priority":2,"explanation":"<explanation>"}}
          {{"priority":3,"explanation":"<explanation>"}}
          {{"priority":4,"explanation":"<explanation>"}}
          {{"priority":5,"explanation":"<explanation>"}}

        Respond ONLY with a single compact JSON object on one line using DOUBLE QUOTES for keys and strings and NO extra text, for example:
        {{"priority":<1-5>,"explanation":"<explanation>"}}
        """
    )
    
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
            "options": {"temperature": 0.3, "top_p": 0.9, "num_predict": 120}
        }

        last_error = None
        for attempt in range(3):
            try:
                t0 = time.time()
                response = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=60,
                )
                response.raise_for_status()
                result = response.json()
                http_ms = int((time.time() - t0) * 1000)

                # Try direct JSON first
                if isinstance(result, dict) and 'response' in result:
                    text = result['response'].strip()
                elif isinstance(result, str):
                    text = result.strip()
                else:
                    # Already parsed JSON from model
                    self._last_call_meta = {"http_ms": http_ms, "parse": "pre-parsed", "raw_len": len(str(result))}
                    logger.debug(f"Ollama call ok model={self.model_name} http_ms={http_ms} parse=pre-parsed size={len(str(result))}")
                    return result

                logger.debug(f"Raw Ollama text: {text}")

                # Parse JSON strictly, with fallbacks:
                # 1) strict json.loads
                # 2) ast.literal_eval for single-quoted dicts
                # 3) extract first {...} and retry both methods
                def _parse_obj(s: str):
                    try:
                        return json.loads(s)
                    except json.JSONDecodeError:
                        try:
                            obj = ast.literal_eval(s)
                            if isinstance(obj, dict):
                                return obj
                        except Exception:
                            pass
                    return None

                obj = _parse_obj(text)
                if obj is not None:
                    # Normalize keys and types
                    if isinstance(obj, dict):
                        norm = {}
                        for k, v in obj.items():
                            nk = str(k).strip().strip('"').strip("'")
                            norm[nk] = v
                        # Coerce priority if string
                        if 'priority' in norm and isinstance(norm['priority'], str):
                            m = re.search(r"[1-5]", norm['priority'])
                            if m:
                                norm['priority'] = int(m.group(0))
                        self._last_call_meta = {"http_ms": http_ms, "parse": "direct", "raw_len": len(text)}
                        logger.debug(f"Ollama call ok model={self.model_name} http_ms={http_ms} parse=direct size={len(text)}")
                        return norm
                    return obj

                match = re.search(r"\{[\s\S]*?\}", text)
                if match:
                    obj = _parse_obj(match.group(0))
                    if obj is not None:
                        if isinstance(obj, dict):
                            norm = {}
                            for k, v in obj.items():
                                nk = str(k).strip().strip('"').strip("'")
                                norm[nk] = v
                            if 'priority' in norm and isinstance(norm['priority'], str):
                                m = re.search(r"[1-5]", norm['priority'])
                                if m:
                                    norm['priority'] = int(m.group(0))
                            self._last_call_meta = {"http_ms": http_ms, "parse": "json-substring", "raw_len": len(match.group(0))}
                            logger.debug(f"Ollama call ok model={self.model_name} http_ms={http_ms} parse=json-substring size={len(match.group(0))}")
                            return norm
                        return obj

                # Last resort: extract a digit 1-5 after "priority"
                num = None
                m = re.search(r"priority\s*[:=]\s*([1-5])", text)
                if m:
                    num = int(m.group(1))
                    self._last_call_meta = {"http_ms": http_ms, "parse": "regex", "raw_len": len(text)}
                    logger.debug(f"Ollama call ok model={self.model_name} http_ms={http_ms} parse=regex size={len(text)}")
                    return {"priority": num, "explanation": "parsed via regex"}

                self._last_call_meta = {"http_ms": http_ms, "parse": "parse-failed", "raw_len": len(text)}
                logger.error(f"Failed to parse Ollama response as JSON: {text}")
                return {"priority": 3, "explanation": "Parse error in Ollama response"}

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

        # After retries, return safe default
        return {"priority": 3, "explanation": f"Error: {str(last_error)}"}
    
    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """
        Assign a priority level using the Ollama model.
        Falls back to MTS if the model is unavailable.
        """
        reason = encounter_data.get('reason_description', '')
        enc_class = encounter_data.get('encounter_class', '')
        
        # Mark short reasons but do not return early; we still apply heuristics and log telemetry
        short_reason = False
        if not reason or len(reason.strip()) < 5:
            short_reason = True
            logger.warning("Reason too short; proceeding with heuristics/LLM and logging telemetry")
        
        try:
            overall_t0 = time.time()
            # Prepare the prompt
            history = encounter_data.get('patient_history', '') or ''
            # Choose target explanation word count based on configured detail
            target_words = 18 if self.expl_detail == 'short' else (32 if self.expl_detail == 'medium' else 55)
            prompt = self.prompt_template.format(
                encounter_class=enc_class,
                reason_description=reason,
                patient_history=history,
                explanation_words=target_words,
            )
            
            # Get response from Ollama (only if not extremely short and we want model help)
            response = self._call_ollama(prompt)
            
            # Validate and return priority (with heuristics if needed)
            priority = None
            if isinstance(response, dict):
                val = response.get('priority')
                try:
                    if isinstance(val, (int, float, str)):
                        priority = int(str(val).strip().strip('"').strip("'"))
                except Exception:
                    priority = None

            # Clamp invalid to None
            if not isinstance(priority, int) or not (1 <= priority <= 5):
                priority = None

            # Post-validation and heuristic override
            heuristic = None
            text = f"{enc_class} {reason}".lower()
            p1_cues = [
                'not breathing', 'no pulse', 'unresponsive', 'unconscious', 'cardiac arrest', 'seizure ongoing', 'seizing', 'severe respiratory distress'
            ]
            p2_cues = [
                'severe bleeding', 'arterial bleeding', 'heavy bleeding', 'major laceration', 'open fracture', 'severe pain', 'anaphylaxis', 'severe allergic'
            ]
            p5_cues = [
                'prescription refill', 'routine prescription', 'administrative', 'no acute symptoms', 'paperwork only'
            ]
            p4_cues = [
                'sore throat', 'minor', 'mild', 'cold', 'cough', 'runny nose', 'stable for days', 'low-grade fever', 'able to swallow'
            ]

            # Sanity-check P1: downgrade to P2 if no P1 cues detected
            if priority == 1 and not any(p in text for p in p1_cues):
                priority = 2
                heuristic = 'p1_sanity_downgrade'

            # If priority is None or 3, apply heuristic classification
            if priority is None or priority == 3:
                if any(p in text for p in p1_cues):
                    priority = 1
                    heuristic = 'p1'
                elif any(p in text for p in p2_cues):
                    priority = 2
                    heuristic = 'p2'
                elif any(p in text for p in p5_cues):
                    priority = 5
                    heuristic = 'p5'
                elif any(p in text for p in p4_cues):
                    priority = 4
                    heuristic = 'p4'
                else:
                    # If reason is very short and no severe cues, prefer P4 over 3
                    if short_reason:
                        priority = 4
                        heuristic = 'short_reason_bias'
                    else:
                        priority = 3
                        heuristic = 'default'

            total_ms = int((time.time() - overall_t0) * 1000)
            logger.debug(f"Ollama triage result: priority={priority} heuristic={heuristic} model={self.model_name} total_ms={total_ms} response={response}")

            # Optional JSONL telemetry
            if self.telemetry_path:
                try:
                    meta = self._last_call_meta or {}
                    explanation_text = None
                    if isinstance(response, dict):
                        explanation_text = response.get('explanation')
                    record = {
                        "ts": int(time.time()*1000),
                        "model": self.model_name,
                        "encounter_class": enc_class,
                        "reason": reason,
                        "short_reason": short_reason,
                        "priority_model": response.get('priority') if isinstance(response, dict) else None,
                        "priority_final": priority,
                        "heuristic": heuristic,
                        "total_ms": total_ms,
                        "http_ms": meta.get('http_ms'),
                        "parse": meta.get('parse'),
                        "raw_text_len": meta.get('raw_len'),
                        "explanation_len": (len(explanation_text) if isinstance(explanation_text, str) else None),
                        "error": meta.get('error'),
                        "status": meta.get('status'),
                        "body": meta.get('body')
                    }
                    with open(self.telemetry_path, 'a') as f:
                        f.write(json.dumps(record) + "\n")
                except Exception as e:
                    logger.error(f"Failed to write Ollama telemetry: {e}")
            return priority
            
        except Exception as e:
            logger.error(f"Error in Ollama triage: {e}")
            # Fall back to MTS on any error unless disabled
            if self.disable_fallback:
                return 3
            return self.mts.assign_priority(encounter_data)
    
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """Get priority information from the MTS system."""
        return self.mts.get_priority_info(priority)
