import { languages } from "../i18n/index.js";

export function LanguagePicker({ value, onChange, compact = false }) {
  return (
    <label className={`language-picker${compact ? " language-picker--compact" : ""}`}>
      <span className="sr-only">Choose language</span>
      <span className="language-picker__flag">{languages.find((item) => item.code === value)?.flag}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Choose language">
        {languages.map((language) => (
          <option value={language.code} key={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>
      <span className="language-picker__chevron" aria-hidden="true">⌄</span>
    </label>
  );
}
