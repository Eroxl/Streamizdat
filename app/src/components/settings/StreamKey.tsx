"use client";
import React from "react";
import { TextInputLabel } from "./TextInputLabel";

export const StreamKey: React.FC<{ streamKey: string; }> = ({ streamKey }) => {
  return (
    <div className="flex gap-1 items-center">
      <TextInputLabel label="Stream Key" />
      <div
        className="rounded px-3 py-2 w-full flex gap-1 items-center"
      >
        <div className="mr-auto w-full text-left tracking-widest select-none">
          •••••••••••••••••••••••
        </div>
        <button
          className="mt-2 px-3 py-1 bg-nord9 text-white rounded"
          onClick={() => {
            window.navigator.clipboard.writeText(streamKey);
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
};
