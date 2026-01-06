"use client";
import React, { useState } from "react";
import { PlatformEmbedSettings } from "./PlatformEmbedSettings";
import { ChevronDown } from "lucide-react";

export const DropdownPlatformEmbedSettings: typeof PlatformEmbedSettings = (props) => {
  const { platform, displayName, isEnabled } = props;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col bg-nord0 rounded-md overflow-hidden">
        <button
            className="w-full text-left flex justify-between p-4 hover:bg-nord1"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
           {displayName} ({platform.slice(0, 1).toUpperCase() + platform.slice(1)})
           {isEnabled || " - Disabled"}
           
           {isDropdownOpen ? <ChevronDown className="inline-block ml-auto transform transition-transform duration-300" /> : <ChevronDown className="duration-300 inline-block ml-2 transform -rotate-90 transition-transform" />}
        </button>

        <PlatformEmbedSettings {...props} className={`transition-all duration-300 flex flex-col gap-1 ${isDropdownOpen ? "h-64 p-4" : "h-0 py-0 px-4"}`} />
    </div>
  );
};
