"use client";
import React, { useState, useEffect } from "react";
import { TextInputSection } from "./TextInputSection";

export const BooleanInput: React.FC<{ label: string; initialValue?: boolean; onSubmit?: (value: boolean) => void; }> = (props) => {
  const { label, initialValue, onSubmit } = props;

  const [value, setValue] = useState(initialValue || false);

  useEffect(() => {
    setValue(initialValue || false);
  }, [initialValue]);

  return (
    <TextInputSection label={label}>
      <div className="flex w-full py-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => {
            const newValue = e.target.checked;
            setValue(newValue);

            if (!onSubmit) return;
            onSubmit(newValue);
          }}
          className="h-5 w-5 accent-nord14" />
      </div>
    </TextInputSection>
  );
};
