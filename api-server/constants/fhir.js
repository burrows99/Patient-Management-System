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

// Triage-focused defaults for Patient $everything
export const TRIAGE_DEFAULT_TYPES = [
  'Condition',
  'Observation',
  'MedicationRequest',
  'MedicationStatement',
  'Procedure',
  'Encounter',
  'AllergyIntolerance',
  'Immunization',
];

export const TRIAGE_DEFAULT_TYPE_FILTER = [
  // Vital signs subset; override as needed
  'Observation?category=vital-signs',
];

export const TRIAGE_DEFAULT_ELEMENTS = [
  // Common clinical fields; intentionally omit meta/text to reduce noise
  'resourceType',
  'id',
  // Include human-readable narrative and descriptive fields
  'text',
  'code',
  'subject',
  'status',
  'category',
  'effectiveDateTime',
  'encounter',
  'valueQuantity',
  'valueCodeableConcept',
  // Common descriptive/clinical context fields (present where applicable)
  'reasonCode',
  'reasonReference',
  'clinicalStatus',
  'verificationStatus',
  'interpretation',
];
