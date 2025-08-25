import React from "react";

interface FormInputProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  darkMode: boolean;
  helpText?: string;
  className?: string;
}

export default function FormInput({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  darkMode,
  helpText,
  className = "",
}: FormInputProps) {
  const inputClasses = `
    w-full px-4 py-3 rounded-lg border transition-colors
    ${
      disabled
        ? darkMode
          ? "bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
          : "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
        : darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
    }
    focus:outline-none focus:ring-2 focus:ring-purple-500/20
  `
    .trim()
    .replace(/\s+/g, " ");

  const labelClasses = `
    block text-sm font-medium mb-2
    ${darkMode ? "text-white" : "text-gray-900"}
  `
    .trim()
    .replace(/\s+/g, " ");

  const helpTextClasses = `
    text-xs mt-1
    ${darkMode ? "text-gray-400" : "text-gray-500"}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <div className={className}>
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
      {helpText && <p className={helpTextClasses}>{helpText}</p>}
    </div>
  );
}
