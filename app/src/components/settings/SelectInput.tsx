"use client";
import React, { useState, useEffect } from "react";
import { TextInputSection } from "./TextInputSection";

export const SelectInput: React.FC<{
  label: string;
  options: { label: string; value: string; }[];
  initialValue?: string;
  onSubmit?: (value: string) => void;
}> = (props) => {
  const { label, options, initialValue, onSubmit } = props;

  const [value, setValue] = useState(initialValue || "");
  const [allowedOptions, setAllowedOptions] = useState(options);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setAllowedOptions(options);
  }, [options]);

  return (
    <TextInputSection label={label}>
      <select
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          setValue(newValue);

          if (!onSubmit) return;
          onSubmit(newValue);
        }}
        className="rounded px-3 py-2 w-full border border-gray-300 text-nord0 bg-white"
      >
        {allowedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </TextInputSection>
  );
};
