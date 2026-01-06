import { useQuery } from "@tanstack/react-query";

type Embed = {
  platform: "twitch" | "youtube" | "kick" | "native";
  channelId: string;
  displayName: string;
  enabled: boolean;
};

type StreamSettings = {
  streamKey: string;
  title: string;
  description: string;
  preferedEmbed: Embed["platform"] | string & {};
  personalAccounts: Embed[];
  supportedEmbeds: Embed[];
};

const useStreamSettings = () => {
  return useQuery({
    queryKey: ["stream-settings"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream-settings`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stream settings: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.settings as StreamSettings;
    },
    retryOnMount: false,
    retryDelay: 1000,
  });
};

export type { StreamSettings, Embed };

export default useStreamSettings;