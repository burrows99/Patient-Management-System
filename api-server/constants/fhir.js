// Single source of truth for FHIR-related constants
// Keep minimal for now; extend as needed

export const DEFAULT_EVERYTHING_COUNT = 2000;

export const EncounterCurrentStatuses = [
  'in-progress',
  'planned',
  'onhold',
  'arrived',
  'triaged',
];

export const Loinc = {
  HR: '8867-4',
  RR: '9279-1',
  TEMP: '8310-5',
  SPO2: '59408-5',
  BP_PANEL: '85354-9',
  BP_SYS: '8480-6',
  BP_DIA: '8462-4',
};
