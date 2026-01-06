"use client";
import React from "react";

export const SettingSubheader: React.FC<{ title: string; description?: string; }> = ({ title, description }) => {
  return (
    <div className="mt-6 mb-2 w-full text-wrap">
      <span className="text-lg font-semibold">{title}</span>
      {description && <div className="opacity-50 text-sm">{description}</div>}
    </div>
  );
};
