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
