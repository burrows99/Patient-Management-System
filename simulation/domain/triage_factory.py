from typing import Literal, Type, Dict, Any
from .base_triage import TriageSystem
from .manchester import ManchesterTriageSystem
from .ollama_agent import OllamaTriageAgent

TriageSystemType = Literal["mta", "ollama"]

def create_triage_system(system_type: TriageSystemType = "mta", **kwargs) -> TriageSystem:
    """
    Factory function to create a triage system instance.
    
    Args:
        system_type: Type of triage system to create ("mta" or "ollama")
        **kwargs: Additional arguments to pass to the triage system constructor
            - For "ollama": model_name, base_url
            
    Returns:
        An instance of the requested triage system
    """
    systems: Dict[TriageSystemType, Type[TriageSystem]] = {
        "mta": ManchesterTriageSystem,
        "ollama": OllamaTriageAgent
    }
    
    if system_type not in systems:
        raise ValueError(f"Unknown triage system: {system_type}. Must be one of {list(systems.keys())}")
    
    return systems[system_type](**kwargs)
