import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Embed, StreamSettings } from "../hooks/useStreamSettings"

const useUpdatePersonalEmbed = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedEmbed: Partial<Embed>) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/personal-embed`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify( updatedEmbed ),
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to update stream settings: ${response.statusText}`)
            }

            const data = await response.json()
            return data.data as StreamSettings;
        },
        onSuccess: (newSettings) => {
            queryClient.setQueryData<StreamSettings>(["stream-settings"], newSettings);
        },
    })
}

export default useUpdatePersonalEmbed;
