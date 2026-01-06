"use client";
import React from "react";

export const SettingHeader: React.FC<{ title: string; description: string; }> = ({ title, description }) => {
  return (
    <div>
      <span className="text-2xl font-bold">{title}</span>
      <div className="mt-2 opacity-50">{description}</div>
    </div>
  );
};
