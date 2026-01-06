import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Embed, StreamSettings } from "../hooks/useStreamSettings"

type UpdateCommunityEmbedPayload = {
    oldPlatform: Embed["platform"];
    newPlatform?: Embed["platform"];
    
    oldChannelId: string;
    newChannelId?: string;
    
    displayName?: string;
    enabled?: boolean;
};

const useUpdateCommunityEmbed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedEmbed: UpdateCommunityEmbedPayload) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/community-embed`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(updatedEmbed),
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to update community embed: ${response.statusText}`)
            }

            const data = await response.json()
            return data.data as StreamSettings;
        },
        onSuccess: (newSettings) => {
            queryClient.setQueryData<StreamSettings>(["stream-settings"], newSettings);
        },
    })
}

export type { UpdateCommunityEmbedPayload };

export default useUpdateCommunityEmbed;
