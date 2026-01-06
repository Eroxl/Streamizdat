import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Embed, StreamSettings } from "../hooks/useStreamSettings"

type CommunityEmbedPayload = {
    platform: Embed["platform"];
    channelId: string;
    displayName: string;
};

const useCreateCommunityEmbed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEmbed: CommunityEmbedPayload) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/community-embed`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(newEmbed),
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to create community embed: ${response.statusText}`)
            }

            const data = await response.json()
            return data.data as StreamSettings;
        },
        onSuccess: (newSettings) => {
            queryClient.setQueryData<StreamSettings>(["stream-settings"], newSettings);
        },
    })
}

export type { CommunityEmbedPayload };

export default useCreateCommunityEmbed;
