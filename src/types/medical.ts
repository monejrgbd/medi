export interface MedicalInfo {
  medications: { name: string }[];
  allergies: { name: string }[];
  chronic_conditions: { name: string }[];
  pets: { name: string }[];
  custom_fields: Record<string, { label: string; values: string[] }>;
}

export interface PrescreeningConfig {
  medications_enabled: boolean;
  allergies_enabled: boolean;
  pets_enabled: boolean;
  pregnancy_enabled: boolean;
  custom_fields: {
    id: string;
    label: string;
    type: "list" | "yes_no";
    none_label?: string;
  }[];
}

/** Raw patient pre-screening form submission, stored on visits.prescreening_data
 *  (jsonb). All fields optional/defensive — treat values as untrusted. */
export interface PrescreeningCustomField {
  type: "list" | "yes_no";
  label: string;
  values?: string[];
  none?: boolean;
  value?: boolean | null;
}

export interface PrescreeningData {
  medications?: string[];
  medications_none?: boolean;
  allergies?: string[];
  allergies_none?: boolean;
  pets?: string[];
  pets_none?: boolean;
  is_pregnant?: boolean | null;
  pregnancy_asked?: boolean;
  custom_fields?: Record<string, PrescreeningCustomField>;
}
