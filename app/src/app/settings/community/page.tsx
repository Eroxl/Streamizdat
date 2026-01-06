"use client";

import useStreamSettings from "@/lib/hooks/useStreamSettings";
import useCreateCommunityEmbed from "@/lib/mutations/useCreateCommunityEmbed";
import useDeleteCommunityEmbed from "@/lib/mutations/useDeleteCommunityEmbed";
import React from "react";
import { SettingHeader } from "@/components/settings/SettingHeader";
import { SettingSubheader } from "@/components/settings/SettingSubheader";
import { AddPlatformEmbed } from "@/components/settings/AddPlatformEmbed";
import useUpdateCommunityEmbed from "@/lib/mutations/useUpdateCommunityEmbed";
import { DropdownPlatformEmbedSettings } from "@/components/settings/DropdownPlatformEmbedSettings";

const STREAM_URL = "rtmp://localhost/live/livestream?key=";
const SUPPORTED_EMBED_PLATFORMS = ["native", "twitch", "youtube", "kick"] as const;
type Platform = typeof SUPPORTED_EMBED_PLATFORMS[number];

export default function Home() {
  const streamSettings = useStreamSettings();
  const createCommunityEmbed = useCreateCommunityEmbed();
  const deleteCommunityEmbed = useDeleteCommunityEmbed();
  const updateCommunityEmbed = useUpdateCommunityEmbed();

  if (streamSettings.isLoading || streamSettings.data === undefined) {
    return (
      <div className="p-12 flex flex-col gap-4 pb-40 max-w-3xl w-full mx-auto">
        <SettingHeader
          title="Community Settings"
          description="Control your communities engagement options below."
        />

        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-12 flex flex-col gap-4 pb-40 max-w-3xl w-full mx-auto">
      <SettingHeader
        title="Community Settings"
        description="Control your communities engagement options below."
      />

      <SettingSubheader title="Community Embeds" description="Allow viewers to embed other streamers within the site when you're offline." />

      <div className="flex flex-col gap-4">
        <div>
          <AddPlatformEmbed
            onAdd={(embed) => {
              createCommunityEmbed.mutate(embed);
            }}
          />
        </div>

        <br className="mb-4" />

        {
          streamSettings.data.supportedEmbeds.map((embed, i) => (
            <DropdownPlatformEmbedSettings
              key={`${i}`}
              platform={embed.platform}
              channelId={embed.channelId}
              isEnabled={embed.enabled}
              displayName={embed.displayName}
              allowDisplayNameEdit={true}
              allowDelete
              allowPlatformChange
              channelIdLabel={embed.platform === "youtube" ? undefined : "Username"}
              allowEnableToggle
              onSubmit={({ channelId, displayName, platform, enabled }) => {
                updateCommunityEmbed.mutate({
                  oldPlatform: embed.platform,
                  newPlatform: platform,
                  oldChannelId: embed.channelId,
                  newChannelId: channelId,
                  displayName,
                  enabled: enabled,
                });
              }}
              onDelete={() => {
                deleteCommunityEmbed.mutate({
                  platform: embed.platform,
                  channelId: embed.channelId,
                });
              }}
            />
          ))
        }
      </div>
    </div>
  )
}
