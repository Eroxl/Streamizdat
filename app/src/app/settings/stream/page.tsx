"use client";

import useStreamSettings from "@/lib/hooks/useStreamSettings";
import useEditStreamSettings from "@/lib/mutations/useEditStreamSettings";
import useUpdatePersonalEmbed from "@/lib/mutations/useUpdatePersonalEmbed";
import React, { useMemo } from "react";
import { SettingHeader } from "@/components/settings/SettingHeader";
import { SettingSubheader } from "@/components/settings/SettingSubheader";
import { BooleanInput } from "@/components/settings/BooleanInput";
import { TextInput } from "@/components/settings/TextInput";
import { StreamKey } from "@/components/settings/StreamKey";
import { SelectInput } from "@/components/settings/SelectInput";
import { PlatformEmbedSettings } from "@/components/settings/PlatformEmbedSettings";

const STREAM_URL = "rtmp://localhost/live/livestream?key=";
const SUPPORTED_EMBED_PLATFORMS = ["native", "twitch", "youtube", "kick"] as const;

export default function Home() {
  const streamSettings = useStreamSettings();
  const editStreamSettingsMutation = useEditStreamSettings();
  const editPersonalEmbedMutation = useUpdatePersonalEmbed();

  if (streamSettings.isLoading || streamSettings.data === undefined) {
    return (
      <div className="p-12 flex flex-col gap-4 pb-40 max-w-3xl w-full mx-auto">
        <SettingHeader
          title="Stream Settings"
          description="Configure your stream display options below."
        />

        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-12 flex flex-col gap-4 pb-40 max-w-3xl w-full mx-auto">
      <SettingHeader
        title="Stream Settings"
        description="Configure your stream display options below."
      />

      <SettingSubheader title="Stream Information" />

      <TextInput
        label="Title"
        placeholder="Enter your stream title"
        initialValue={streamSettings.data.title}
        onSubmit={(value) => {
          editStreamSettingsMutation.mutate({ title: value })
        }}
      />
      <TextInput
        label="Description"
        placeholder="Enter your stream description"
        initialValue={streamSettings.data.description}
        onSubmit={(value) => {
          editStreamSettingsMutation.mutate({ description: value })
        }}
      />

      <SettingSubheader title="Stream Configuration" />

      <div>
        <StreamKey streamKey={streamSettings.data.streamKey} />
      </div>

      <span className="text-md font-semibold">How to stream:</span>
      <ol className="list-decimal list-inside flex flex-col gap-1 pl-4">
        <li className="marker:text-white/10">Open <a href="https://obsproject.com/" className="text-nord9 underline">OBS Studio</a> or your preferred streaming software.</li>
        <li className="marker:text-white/10">Go to the settings and find the &quot;Stream&quot; section.</li>
        <li className="marker:text-white/10">Select &quot;Custom&quot; as the service.</li>
        <li className="marker:text-white/10">
          Enter{" "}
          <span
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(`${STREAM_URL}${streamSettings.data.streamKey}`);
            }}
            className="text-nord9 cursor-pointer"
          >
            {STREAM_URL}&#123;your_stream_key&#125;
          </span>{" "}
          as the Server URL, where &#123;your_stream_key&#125;
          is your actual stream key (you can click the URL to copy it).
        </li>
        <li className="marker:text-white/10">Start streaming from your software, and your stream should appear on the platform!</li>
      </ol>

      <SettingSubheader title="Connected Personal Accounts" description="These accounts will be used to easily allow viewrs to embed your stream on supported platforms. Leave blank to disable embedding on a platform." />

      <SelectInput
        label="Default Embed Platform"
        options={
          streamSettings.data.personalAccounts
            .filter((embed) => embed.enabled)
            .map((embed) => ({
              label: embed.platform.charAt(0).toUpperCase() + embed.platform.slice(1),
              value: embed.platform
            }))
        }
        onSubmit={(value) => {
          editStreamSettingsMutation.mutate({ preferedEmbed: value });
        }}
        initialValue={streamSettings.data.preferedEmbed}
      />

      <div>
        <span className="capitalize font-bold text-lg">Native Embed</span>
        <BooleanInput
          label="Enable Native Embed"
          initialValue={streamSettings.data.personalAccounts.some(account => account.platform === "native" && account.enabled)}
          onSubmit={(value) => {
            editPersonalEmbedMutation.mutate({
              platform: "native",
              enabled: value,
            });
          }}
        />
      </div>

      <div>
        {
          SUPPORTED_EMBED_PLATFORMS.map((platform) => {
            if (platform === "native") return null;

            const accountForPlatform = streamSettings.data.personalAccounts.filter(account => account.platform === platform)[0] || {};

            return (
              <div key={platform}>
                <span className="capitalize font-bold text-lg">{platform}</span>
                <PlatformEmbedSettings
                  key={platform}
                  platform={platform}
                  channelIdLabel={platform === "youtube" ? undefined : "Username"}
                  channelId={accountForPlatform.channelId || ''}
                  className="flex flex-col gap-1 mt-2 mb-4"
                  onSubmit={({ channelId, displayName }) => {
                    editPersonalEmbedMutation.mutate({
                      platform,
                      channelId,
                      displayName,
                      enabled: channelId.length > 0,
                    });
                  }}
                />
              </div>
            );
          })
        }
      </div>
    </div>
  )
}
