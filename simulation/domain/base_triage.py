from abc import ABC, abstractmethod
from typing import Dict, Any

class TriageSystem(ABC):
    """Abstract base class for triage systems."""
    
    @abstractmethod
    def assign_priority(self, encounter_data: Dict[str, Any]) -> int:
        """
        Assign a priority level based on the encounter data.
        
        Args:
            encounter_data: Dictionary containing encounter information including
                         'encounter_class' and 'reason_description'
        
        Returns:
            int: Priority level (1-5, where 1 is most urgent)
        """
        pass
    
    @abstractmethod
    def get_priority_info(self, priority: int) -> Dict[str, Any]:
        """
        Get information about a priority level.
        
        Args:
            priority: Priority level (1-5)
            
        Returns:
            Dict with priority information (name, color, max_wait_min, etc.)
        """
        pass
