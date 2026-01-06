"use client";
import React, { useState, useEffect } from "react";
import { TextInputSection } from "./TextInputSection";

export const TextInput: React.FC<{ label: string; placeholder?: string; initialValue?: string; onSubmit?: (value: string) => void; }> = (props) => {
  const { label, placeholder, initialValue, onSubmit } = props;

  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  return (
    <TextInputSection label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!onSubmit) return;

          onSubmit(value);
        }}
        placeholder={placeholder}
        className="rounded px-3 py-2 w-full border border-gray-300 text-nord0" />
    </TextInputSection>
  );
};
