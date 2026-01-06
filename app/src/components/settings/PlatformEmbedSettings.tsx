"use client";
import React, { useEffect, useState } from "react";
import { TextInput } from "./TextInput";
import { SelectInput } from "./SelectInput";
import { BooleanInput } from "./BooleanInput";

export const PlatformEmbedSettings: React.FC<{
  platform: "twitch" | "youtube" | "kick" | "native";
  channelId: string;
  channelIdLabel?: string;
  isEnabled?: boolean;
  displayName?: string;
  allowDisplayNameEdit?: boolean;
  allowDelete?: boolean;
  allowPlatformChange?: boolean;
  allowEnableToggle?: boolean;
  className?: string;
  onDelete?: (channelId: string) => void;
  onSubmit?: (settings: { channelId: string; displayName: string; platform: "twitch" | "youtube" | "kick" | "native", enabled?: boolean }) => void;
}> = (props) => {
  const { platform, channelId, displayName, className, allowDisplayNameEdit, isEnabled, allowEnableToggle, allowPlatformChange, allowDelete, channelIdLabel, onDelete, onSubmit } = props;

  const [platformState, setPlatformState] = useState(platform);

  useEffect(() => {
    setPlatformState(platform);
  }, [platform]);

  return (
    <div key={channelId} className={className || "flex flex-col gap-1 mt-2 mb-4 bg-nord0 p-6 rounded-md"}>
      {
        allowPlatformChange ? (
          <SelectInput
            label="Platform"
            options={[
              { label: "Twitch", value: "twitch" },
              { label: "YouTube", value: "youtube" },
              { label: "Kick", value: "kick" },
            ]}
            initialValue={platformState}
            onSubmit={(value) => {
              setPlatformState(value as "twitch" | "youtube" | "kick");
              if (!onSubmit) return;

              onSubmit({ channelId, displayName: displayName || '', platform: value as "twitch" | "youtube" | "kick" | "native", enabled: isEnabled })
            }}
          />
        ) : null 
      }
      <TextInput
        label={channelIdLabel || "Channel ID"}
        initialValue={channelId}
        onSubmit={(value) => {
          if (!onSubmit) return;

          onSubmit({ channelId: value, displayName: displayName || '', platform: platformState, enabled: isEnabled });
        }} />
      {allowDisplayNameEdit && (
        <TextInput
          label="Display Name"
          initialValue={displayName}
          onSubmit={(value) => {
            if (!onSubmit) return;

            onSubmit({ channelId, displayName: value, platform: platformState, enabled: isEnabled });
          }} />
      )}
      {
        allowEnableToggle ? (
          <BooleanInput
            label="Enabled"
            initialValue={props.isEnabled || false}
            onSubmit={(value) => {
              if (!onSubmit) return;

              onSubmit({ channelId, displayName: displayName || '', platform: platformState, enabled: value });
            }} />
        ) : null
      }
      {allowDelete && onDelete && (
        <button
          className="bg-nord11 w-full hover:underline self-start mt-2 py-2 px-4 rounded-md text-white"
          onClick={() => onDelete(channelId)}
        >
          Delete Embed
        </button>
      )}
    </div>
  );
};
