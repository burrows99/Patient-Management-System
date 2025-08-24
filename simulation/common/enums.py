from __future__ import annotations
from enum import Enum, IntEnum


class TriageLevel(IntEnum):
    P1 = 1
    P2 = 2
    P3 = 3
    P4 = 4
    P5 = 5


class EncounterClass(str, Enum):
    EMERGENCY = "emergency"
    URGENT_CARE = "urgentcare"
    AMBULATORY = "ambulatory"
    OUTPATIENT = "outpatient"
    WELLNESS = "wellness"
    INPATIENT = "inpatient"
