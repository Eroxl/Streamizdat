"use client";

import useStreamSettings from "@/lib/hooks/useStreamSettings";
import useCreateCommunityEmbed from "@/lib/mutations/useCreateCommunityEmbed";
import useDeleteCommunityEmbed from "@/lib/mutations/useDeleteCommunityEmbed";
import React, { useState } from "react";
import { SettingHeader } from "@/components/settings/SettingHeader";
import { SettingSubheader } from "@/components/settings/SettingSubheader";
import { AddPlatformEmbed } from "@/components/settings/AddPlatformEmbed";
import useUpdateCommunityEmbed from "@/lib/mutations/useUpdateCommunityEmbed";
import { DropdownPlatformEmbedSettings } from "@/components/settings/DropdownPlatformEmbedSettings";
import useEmotes from "@/lib/hooks/useEmotes";
import usePermissions, { hasPermission } from "@/lib/hooks/usePermissions";
import useUploadEmote from "@/lib/mutations/useUploadEmote";
import useDeleteEmote from "@/lib/mutations/useDeleteEmote";
import { EmoteCard } from "@/components/settings/EmoteCard";
import { AddEmote } from "@/components/settings/AddEmote";

const STREAM_URL = "rtmp://localhost/live/livestream?key=";
const SUPPORTED_EMBED_PLATFORMS = ["native", "twitch", "youtube", "kick"] as const;
type Platform = typeof SUPPORTED_EMBED_PLATFORMS[number];

export default function Home() {
  const streamSettings = useStreamSettings();
  const createCommunityEmbed = useCreateCommunityEmbed();
  const deleteCommunityEmbed = useDeleteCommunityEmbed();
  const updateCommunityEmbed = useUpdateCommunityEmbed();
  
  // Emote management
  const emotes = useEmotes();
  const permissions = usePermissions();
  const uploadEmote = useUploadEmote();
  const deleteEmote = useDeleteEmote();
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const canManageEmotes = hasPermission(permissions.data, "manage_emotes");

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

      {/* Emotes Section */}
      <div className="mt-8">
        <SettingSubheader 
          title="Channel Emotes" 
          description="Custom emotes that can be used in chat by your community." 
        />

        <div className="flex flex-col gap-4 mt-4">
          {canManageEmotes && (
            <AddEmote
              onAdd={(file, name) => {
                setUploadError(null);
                uploadEmote.mutate(
                  { file, name },
                  {
                    onError: (error) => {
                      setUploadError(error.message);
                    },
                  }
                );
              }}
              isUploading={uploadEmote.isPending}
              error={uploadError}
            />
          )}

          {emotes.isLoading && (
            <div className="text-nord4/70">Loading emotes...</div>
          )}

          {emotes.error && (
            <div className="text-nord11">
              Failed to load emotes: {emotes.error.message}
            </div>
          )}

          {emotes.data && emotes.data.length === 0 && (
            <div className="text-nord4/70 bg-nord0 rounded-md p-4">
              No emotes uploaded yet.
            </div>
          )}

          {emotes.data && emotes.data.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-6 w-full gap-3">
              {emotes.data.map((emote) => (
                <EmoteCard
                  key={emote.id}
                  emote={emote}
                  canManage={canManageEmotes}
                  onDelete={(id) => deleteEmote.mutate(id)}
                  isDeleting={deleteEmote.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
