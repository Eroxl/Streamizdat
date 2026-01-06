"use client";
import React from "react";
import { TextInputLabel } from "./TextInputLabel";

export const TextInputSection: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => {
  return (
    <div className="flex gap-1 w-full items-center">
      <TextInputLabel label={label} />
      {children}
    </div>
  );
};
