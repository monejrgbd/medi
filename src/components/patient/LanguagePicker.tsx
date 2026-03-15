"use client";

import { useState } from "react";

interface LanguagePickerProps {
  onSelect: (language: string) => void;
  loading: boolean;
}

const TOP_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "uk", name: "Ukrainian" },
];

const OTHER_LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "tl", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fy", name: "Frisian" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "he", name: "Hebrew" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "ga", name: "Irish" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "ku", name: "Kurdish" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "or", name: "Odia" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "ro", name: "Romanian" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "tt", name: "Tatar" },
  { code: "te", name: "Telugu" },
  { code: "ur", name: "Urdu" },
  { code: "ug", name: "Uyghur" },
  { code: "uz", name: "Uzbek" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
];

const ALL_LANGUAGES = [...TOP_LANGUAGES, ...OTHER_LANGUAGES];

export default function LanguagePicker({ onSelect, loading }: LanguagePickerProps) {
  const [selected, setSelected] = useState("en");
  const [search, setSearch] = useState("");
  // LanguagePicker is shown before language is set, so we keep English labels here (language names are universal)

  const filtered = search
    ? ALL_LANGUAGES.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_LANGUAGES;

  const topFiltered = filtered.filter((l) =>
    TOP_LANGUAGES.some((t) => t.code === l.code)
  );
  const otherFiltered = filtered.filter(
    (l) => !TOP_LANGUAGES.some((t) => t.code === l.code)
  );

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold text-ink mb-2 text-center">
        Select Your Language
      </h2>
      <p className="text-sm text-slate mb-4 text-center">
        Choose your preferred language for the conversation.
      </p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search languages..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:border-hilt-blue focus:outline-none mb-3"
      />

      <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 mb-4">
        {topFiltered.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              selected === lang.code
                ? "bg-blue-50 text-hilt-blue font-medium"
                : "hover:bg-gray-50 text-ink"
            }`}
          >
            {lang.name}
          </button>
        ))}
        {otherFiltered.length > 0 && topFiltered.length > 0 && (
          <div className="border-t border-gray-100 px-3 py-1.5 text-xs text-ash font-medium">
            Other Languages
          </div>
        )}
        {otherFiltered.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              selected === lang.code
                ? "bg-blue-50 text-hilt-blue font-medium"
                : "hover:bg-gray-50 text-ink"
            }`}
          >
            {lang.name}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-ash text-center">
            No languages found.
          </p>
        )}
      </div>

      <button
        onClick={() => onSelect(selected)}
        disabled={loading}
        className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
