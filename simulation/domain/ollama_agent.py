import json
from typing import Dict, Any
import requests
from pathlib import Path
import logging

from .base_triage import TriageSystem
from .manchester import ManchesterTriageSystem

logger = logging.getLogger(__name__)

class OllamaTriageAgent(TriageSystem):
    """Ollama-based triage agent that uses a local LLM for priority assignment."""
    
    def __init__(self, model_name: str = "mistral:7b-instruct", base_url: str = "http://localhost:11434", disable_fallback: bool = False):
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
        self.prompt_template = """
        You are a medical triage assistant. Your task is to assign a priority level (1-5) to a patient based on their symptoms and condition.
        
        Priority levels:
        1. Immediate (life-threatening) - requires immediate medical attention
        2. Very Urgent - condition could deteriorate quickly
        3. Urgent - serious but stable condition
        4. Standard - needs assessment but not immediately urgent
        5. Non-urgent - can wait for assessment
        
        Patient Information:
        Encounter Type: {encounter_class}
        Reason for Visit: {reason_description}
        
        Respond ONLY with a JSON object containing the priority level and a brief explanation, like this:
        {{"priority": 3, "explanation": "Patient has moderate symptoms that require prompt attention but are not immediately life-threatening."}}
        """
    
    def _call_ollama(self, prompt: str) -> Dict[str, Any]:
        """Make a request to the local Ollama API."""
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract JSON from response (handling both direct JSON and text responses)
            try:
                if isinstance(result, dict) and 'response' in result:
                    return json.loads(result['response'].strip())
                elif isinstance(result, str):
                    return json.loads(result.strip())
                return result
            except json.JSONDecodeError:
                logger.error(f"Failed to parse Ollama response as JSON: {result}")
                return {"priority": 3, "explanation": "Error processing response"}
                
        except Exception as e:
            logger.error(f"Error calling Ollama API: {e}")
            return {"priority": 3, "explanation": f"Error: {str(e)}"}
    
    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """
        Assign a priority level using the Ollama model.
        Falls back to MTS if the model is unavailable.
        """
        reason = encounter_data.get('reason_description', '')
        enc_class = encounter_data.get('encounter_class', '')
        
        # Skip LLM for empty or very short reasons
        if not reason or len(reason.strip()) < 5:
            if self.disable_fallback:
                logger.warning("Ollama disabled fallback and reason too short; defaulting to priority 3")
                return 3
            return self.mts.assign_priority(encounter_data)
        
        try:
            # Prepare the prompt
            prompt = self.prompt_template.format(
                encounter_class=enc_class,
                reason_description=reason
            )
            
            # Get response from Ollama
            response = self._call_ollama(prompt)
            
            # Validate and return priority
            priority = int(response.get('priority', 3))
            if priority < 1 or priority > 5:
                logger.warning(f"Invalid priority {priority} from Ollama")
                if self.disable_fallback:
                    return 3
                return self.mts.assign_priority(encounter_data)
                
            logger.debug(f"Ollama triage result: {response}")
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
