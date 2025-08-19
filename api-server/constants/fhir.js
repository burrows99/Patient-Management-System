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

// Lean elements: minimal payload (omits narrative/text)
export const TRIAGE_ELEMENTS_LEAN = [
  'resourceType',
  'id',
  'code',
  'subject',
  'status',
  'category',
  'effectiveDateTime',
  'encounter',
  'valueQuantity',
  'valueCodeableConcept',
];

// Rich elements: include narrative and descriptive text
export const TRIAGE_ELEMENTS_RICH = [
  // Core
  'resourceType',
  'id',
  'status',
  'subject',
  'encounter',
  // Narrative & notes
  'text',
  'note',
  // Codes and displays
  'code',
  'category',
  'type',
  'reasonCode',
  'interpretation',
  // Observation values
  'effectiveDateTime',
  'valueQuantity',
  'valueCodeableConcept',
  'valueString',
  // Condition-specific
  'clinicalStatus',
  'verificationStatus',
  'severity',
  'onsetDateTime',
  // Encounter-specific
  'period',
  // Medication
  'medicationCodeableConcept',
  'dosageInstruction',
  // Immunization
  'vaccineCode',
  // Allergy
  'reaction',
];

export const TRIAGE_ELEMENT_PRESETS = {
  lean: TRIAGE_ELEMENTS_LEAN,
  rich: TRIAGE_ELEMENTS_RICH,
};
