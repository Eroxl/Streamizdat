import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Embed, StreamSettings } from "../hooks/useStreamSettings"

type DeleteCommunityEmbedPayload = {
    platform: Embed["platform"];
    channelId: string;
};

const useDeleteCommunityEmbed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: DeleteCommunityEmbedPayload) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/community-embed`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to delete community embed: ${response.statusText}`)
            }

            const data = await response.json()
            return data.data as StreamSettings;
        },
        onSuccess: (newSettings) => {
            queryClient.setQueryData<StreamSettings>(["stream-settings"], newSettings);
        },
    })
}

export type { DeleteCommunityEmbedPayload };

export default useDeleteCommunityEmbed;
