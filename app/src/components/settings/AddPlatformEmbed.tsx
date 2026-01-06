"use client";
import React, { useState } from "react";
import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";

const PLATFORMS = ["twitch", "youtube", "kick"] as const;
type Platform = typeof PLATFORMS[number];

export const AddPlatformEmbed: React.FC<{
  onAdd?: (embed: { platform: Platform; channelId: string; displayName: string }) => void;
  onCancel?: () => void;
}> = (props) => {
  const { onAdd, onCancel } = props;

  const [isAdding, setIsAdding] = useState(false);
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>("twitch");
  const [channelId, setChannelId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPlatform(PLATFORMS[0]);
    
    setChannelId("");
    setDisplayName("");

    setError(null);
  };

  const handleStartAdding = () => {
    resetForm();

    setIsAdding(true);
  };

  const handleCancel = () => {
    resetForm();
    
    setIsAdding(false);
    onCancel?.();
  };

  const handleSubmit = () => {
    if (!channelId.trim()) {
      setError("Channel ID is required");
      return;
    }

    if (!displayName.trim()) {
      setError("Display Name is required");
      return;
    }

    onAdd?.({
      platform,
      channelId: channelId.trim(),
      displayName: displayName.trim(),
    });

    setIsAdding(false);
    resetForm();
  };

  if (!isAdding) {
    return (
      <button
        onClick={handleStartAdding}
        className="flex items-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-white bg-nord10 hover:bg-nord9 rounded-lg transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add Platform Embed
      </button>
    );
  }

  return (
    <div className="mt-4 p-6 rounded-md bg-nord0">
      <h3 className="text-lg font-semibold text-nord6 mb-4">Add New Platform Embed</h3>

      <div className="flex flex-col gap-1">
        <SelectInput
          label="Platform"
          options={PLATFORMS.map((p) => ({
            label: p.charAt(0).toUpperCase() + p.slice(1),
            value: p,
        }))}
          initialValue={platform}
          onSubmit={(value) => setPlatform(value as Platform)}
        />

        <TextInput
          label={platform === "youtube" ? "Channel ID" : "Username"}
          placeholder={platform === "youtube" ? "Enter channel ID" : `Enter username`}
          initialValue={channelId}
          onSubmit={(value) => {
            setChannelId(value);
            setError(null);
          }}
        />

        <TextInput
          label="Display Name"
          placeholder="Enter display name"
          initialValue={displayName}
          onSubmit={(value) => {
            setDisplayName(value);
            setError(null);
          }}
        />

        {error && (
          <p className="text-sm text-nord11 mt-2">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-nord14 hover:bg-nord7 rounded-lg transition-colors"
          >
            Add Embed
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-nord6 bg-nord3 hover:bg-nord2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
