"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { PrescreeningConfig } from "@/types/medical";

interface PreScreeningFormProps {
  sessionToken: string;
  config: PrescreeningConfig;
  patientSex: string | null;
  patientBirthday: string | null;
  hasPreviousVisits: boolean;
  existingMedications: { name: string }[];
  existingAllergies: { name: string }[];
  existingPets: { name: string }[];
  existingCustomFields: Record<string, { label: string; values: string[] }>;
  onComplete: () => void;
  demoMode?: boolean;
}

export default function PreScreeningForm({
  sessionToken,
  config,
  patientSex,
  patientBirthday,
  hasPreviousVisits,
  existingMedications,
  existingAllergies,
  existingPets,
  existingCustomFields,
  onComplete,
  demoMode,
}: PreScreeningFormProps) {
  const { t } = useLanguage();

  // Determine pregnancy visibility
  const showPregnancy = (() => {
    if (!config.pregnancy_enabled || patientSex !== "female" || !patientBirthday) return false;
    const age = Math.floor((Date.now() - new Date(patientBirthday).getTime()) / 31557600000);
    return age >= 17;
  })();

  // Count visible sections for auto-complete check
  const visibleSectionCount = (() => {
    let count = 0;
    if (config.medications_enabled) count++;
    if (config.allergies_enabled) count++;
    if (config.pets_enabled) count++;
    if (showPregnancy) count++;
    count += config.custom_fields.length;
    return count;
  })();

  // --- State ---
  const [medications, setMedications] = useState<string[]>(
    demoMode ? ["Ibuprofen", "Lisinopril"] : existingMedications.map((m) => m.name)
  );
  const [medicationsNone, setMedicationsNone] = useState(false);
  const [medicationsInput, setMedicationsInput] = useState("");

  const [allergies, setAllergies] = useState<string[]>(
    demoMode ? ["Penicillin"] : existingAllergies.map((a) => a.name)
  );
  const [allergiesNone, setAllergiesNone] = useState(false);
  const [allergiesInput, setAllergiesInput] = useState("");

  const [pets, setPets] = useState<string[]>(
    demoMode ? ["Dog"] : existingPets.map((p) => p.name)
  );
  const [petsNone, setPetsNone] = useState(false);
  const [petsInput, setPetsInput] = useState("");

  const [isPregnant, setIsPregnant] = useState<boolean | null>(
    demoMode && showPregnancy ? false : null
  );

  // Custom fields state
  const [customListValues, setCustomListValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const field of config.custom_fields) {
      if (field.type === "list") {
        if (demoMode && config.custom_fields.indexOf(field) === 0) {
          init[field.id] = ["Sample"];
        } else if (existingCustomFields[field.id]) {
          init[field.id] = [...existingCustomFields[field.id].values];
        } else {
          init[field.id] = [];
        }
      }
    }
    return init;
  });

  const [customListNone, setCustomListNone] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const field of config.custom_fields) {
      if (field.type === "list") {
        init[field.id] = false;
      }
    }
    return init;
  });

  const [customListInputs, setCustomListInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of config.custom_fields) {
      if (field.type === "list") {
        init[field.id] = "";
      }
    }
    return init;
  });

  const [customYesNoValues, setCustomYesNoValues] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    for (const field of config.custom_fields) {
      if (field.type === "yes_no") {
        if (demoMode && config.custom_fields.indexOf(field) === 0) {
          init[field.id] = false;
        } else {
          init[field.id] = null;
        }
      }
    }
    return init;
  });

  const [saving, setSaving] = useState(false);

  // Auto-complete if no visible sections
  useEffect(() => {
    if (visibleSectionCount === 0) {
      onComplete();
    }
  }, [visibleSectionCount, onComplete]);

  // --- Validation ---
  const isFormComplete = useCallback(() => {
    if (config.medications_enabled) {
      if (medications.length === 0 && !medicationsNone) return false;
    }
    if (config.allergies_enabled) {
      if (allergies.length === 0 && !allergiesNone) return false;
    }
    if (config.pets_enabled) {
      if (pets.length === 0 && !petsNone) return false;
    }
    if (showPregnancy) {
      if (isPregnant === null) return false;
    }
    for (const field of config.custom_fields) {
      if (field.type === "list") {
        const vals = customListValues[field.id] || [];
        const none = customListNone[field.id] || false;
        if (vals.length === 0 && !none) return false;
      } else {
        if (customYesNoValues[field.id] === null || customYesNoValues[field.id] === undefined) return false;
      }
    }
    return true;
  }, [
    config, medications, medicationsNone, allergies, allergiesNone,
    pets, petsNone, showPregnancy, isPregnant, customListValues,
    customListNone, customYesNoValues,
  ]);

  // --- Handlers ---
  const addToList = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    setList((prev) => [...prev, trimmed]);
    setInput("");
  };

  const removeFromList = (
    index: number,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = {};

      if (config.medications_enabled) {
        data.medications = medications;
        data.medications_none = medicationsNone;
      }
      if (config.allergies_enabled) {
        data.allergies = allergies;
        data.allergies_none = allergiesNone;
      }
      if (config.pets_enabled) {
        data.pets = pets;
        data.pets_none = petsNone;
      }
      if (showPregnancy) {
        data.is_pregnant = isPregnant;
        data.pregnancy_asked = true;
      }

      const customFieldsData: Record<string, unknown> = {};
      for (const field of config.custom_fields) {
        if (field.type === "list") {
          customFieldsData[field.id] = {
            type: "list",
            label: field.label,
            values: customListValues[field.id] || [],
            none: customListNone[field.id] || false,
          };
        } else {
          customFieldsData[field.id] = {
            type: "yes_no",
            label: field.label,
            value: customYesNoValues[field.id] ?? null,
          };
        }
      }
      if (Object.keys(customFieldsData).length > 0) {
        data.custom_fields = customFieldsData;
      }

      const supabase = createClient();
      const { error } = await supabase.rpc("save_prescreening_data", {
        p_session_token: sessionToken,
        p_data: data,
      });

      if (error) {
        console.error("Failed to save prescreening data:", error);
      }

      onComplete();
    } catch (err) {
      console.error("Failed to save prescreening data:", err);
      setSaving(false);
    }
  };

  // Don't render if no sections
  if (visibleSectionCount === 0) return null;

  let sectionIndex = 0;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Demo banner */}
      {demoMode && (
        <div className="w-full text-center mb-4">
          <p className="text-sm font-medium text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
            You can customize the fields that get asked before the AI conversation per location.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink">
          {hasPreviousVisits ? t("prescreening.title.returning") : t("prescreening.title.new")}
        </h2>
        <p className="text-sm text-slate mt-1">
          {hasPreviousVisits ? t("prescreening.subtitle.returning") : t("prescreening.subtitle.new")}
        </p>
      </div>

      {/* Medications */}
      {config.medications_enabled && (
        <ListSection
          label={t("prescreening.medications")}
          items={medications}
          setItems={setMedications}
          inputValue={medicationsInput}
          setInputValue={setMedicationsInput}
          noneChecked={medicationsNone}
          setNoneChecked={setMedicationsNone}
          noneLabel={t("prescreening.medications.none")}
          addPlaceholder={t("prescreening.medications.placeholder")}
          addButtonLabel={t("prescreening.add")}
          onAdd={addToList}
          onRemove={removeFromList}
          isFirst={sectionIndex++ === 0}
        />
      )}

      {/* Allergies */}
      {config.allergies_enabled && (
        <ListSection
          label={t("prescreening.allergies")}
          items={allergies}
          setItems={setAllergies}
          inputValue={allergiesInput}
          setInputValue={setAllergiesInput}
          noneChecked={allergiesNone}
          setNoneChecked={setAllergiesNone}
          noneLabel={t("prescreening.allergies.none")}
          addPlaceholder={t("prescreening.allergies.placeholder")}
          addButtonLabel={t("prescreening.add")}
          onAdd={addToList}
          onRemove={removeFromList}
          isFirst={sectionIndex++ === 0}
        />
      )}

      {/* Pets */}
      {config.pets_enabled && (
        <ListSection
          label={t("prescreening.pets")}
          items={pets}
          setItems={setPets}
          inputValue={petsInput}
          setInputValue={setPetsInput}
          noneChecked={petsNone}
          setNoneChecked={setPetsNone}
          noneLabel={t("prescreening.pets.none")}
          addPlaceholder={t("prescreening.pets.placeholder")}
          addButtonLabel={t("prescreening.add")}
          onAdd={addToList}
          onRemove={removeFromList}
          isFirst={sectionIndex++ === 0}
        />
      )}

      {/* Pregnancy */}
      {showPregnancy && (
        <YesNoSection
          label={t("prescreening.pregnancy")}
          value={isPregnant}
          onChange={setIsPregnant}
          yesLabel={t("prescreening.yes")}
          noLabel={t("prescreening.no")}
          isFirst={sectionIndex++ === 0}
        />
      )}

      {/* Custom fields */}
      {config.custom_fields.map((field) => {
        const isFirst = sectionIndex++ === 0;

        if (field.type === "list") {
          return (
            <ListSection
              key={field.id}
              label={field.label}
              items={customListValues[field.id] || []}
              setItems={(updater) => {
                setCustomListValues((prev) => ({
                  ...prev,
                  [field.id]: typeof updater === "function" ? updater(prev[field.id] || []) : updater,
                }));
              }}
              inputValue={customListInputs[field.id] || ""}
              setInputValue={(val) => {
                setCustomListInputs((prev) => ({
                  ...prev,
                  [field.id]: typeof val === "function" ? val(prev[field.id] || "") : val,
                }));
              }}
              noneChecked={customListNone[field.id] || false}
              setNoneChecked={(val) => {
                setCustomListNone((prev) => ({
                  ...prev,
                  [field.id]: typeof val === "function" ? val(prev[field.id] || false) : val,
                }));
              }}
              noneLabel={field.none_label || t("prescreening.none.generic")}
              addPlaceholder={field.label}
              addButtonLabel={t("prescreening.add")}
              onAdd={addToList}
              onRemove={removeFromList}
              isFirst={isFirst}
            />
          );
        }

        return (
          <YesNoSection
            key={field.id}
            label={field.label}
            value={customYesNoValues[field.id] ?? null}
            onChange={(val) => {
              setCustomYesNoValues((prev) => ({ ...prev, [field.id]: val }));
            }}
            yesLabel={t("prescreening.yes")}
            noLabel={t("prescreening.no")}
            isFirst={isFirst}
          />
        );
      })}

      {/* Continue button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={!isFormComplete() || saving}
          className="w-full bg-hilt-blue text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? t("prescreening.saving") : t("prescreening.continue")}
        </button>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface ListSectionProps {
  label: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  noneChecked: boolean;
  setNoneChecked: React.Dispatch<React.SetStateAction<boolean>>;
  noneLabel: string;
  addPlaceholder: string;
  addButtonLabel: string;
  onAdd: (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => void;
  onRemove: (
    index: number,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  isFirst: boolean;
}

function ListSection({
  label,
  items,
  setItems,
  inputValue,
  setInputValue,
  noneChecked,
  setNoneChecked,
  noneLabel,
  addPlaceholder,
  addButtonLabel,
  onAdd,
  onRemove,
  isFirst,
}: ListSectionProps) {
  return (
    <div className={isFirst ? "" : "border-t border-gray-100 pt-4 mt-4"}>
      <label className="text-xs font-semibold text-ink mb-2 block">{label}</label>

      {/* Tags */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-1 bg-gray-100 text-ink text-sm px-2.5 py-1 rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i, setItems)}
                className="text-ash hover:text-ink"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(inputValue, items, setItems, setInputValue);
            }
          }}
          placeholder={addPlaceholder}
          disabled={noneChecked}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-hilt-blue disabled:opacity-50 disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={() => onAdd(inputValue, items, setItems, setInputValue)}
          disabled={noneChecked}
          className="bg-gray-100 text-ink text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {addButtonLabel}
        </button>
      </div>

      {/* None checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={noneChecked}
          onChange={(e) => {
            setNoneChecked(e.target.checked);
            if (e.target.checked) {
              setItems([]);
              setInputValue("");
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
        />
        <span className="text-sm text-slate">{noneLabel}</span>
      </label>
    </div>
  );
}

interface YesNoSectionProps {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
  yesLabel: string;
  noLabel: string;
  isFirst: boolean;
}

function YesNoSection({ label, value, onChange, yesLabel, noLabel, isFirst }: YesNoSectionProps) {
  return (
    <div className={isFirst ? "" : "border-t border-gray-100 pt-4 mt-4"}>
      <label className="text-xs font-semibold text-ink mb-2 block">{label}</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === true
              ? "bg-hilt-blue text-white"
              : "bg-gray-100 text-ink hover:bg-gray-200"
          }`}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === false
              ? "bg-hilt-blue text-white"
              : "bg-gray-100 text-ink hover:bg-gray-200"
          }`}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}
