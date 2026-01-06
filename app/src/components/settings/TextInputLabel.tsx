"use client";
import React from "react";

export const TextInputLabel: React.FC<{ label: string; }> = ({ label }) => {
  return (
    <label className="font-medium w-96 text-white/70">{label}:</label>
  );
};
