import { useMutation, useQueryClient } from "@tanstack/react-query"
import { StreamSettings } from "../hooks/useStreamSettings"

const useEditStreamSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updatedSettings: Partial<StreamSettings>) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/stream-settings`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify( updatedSettings ),
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to update stream settings: ${response.statusText}`)
            }

            const data = await response.json()
            return data.data as StreamSettings;
        },
        onSuccess: (newSettings) => {
            const initialSettings = queryClient.getQueryData<StreamSettings>(["stream-settings"]);

            queryClient.setQueryData<StreamSettings>(["stream-settings"], {
                ...initialSettings,
                ...newSettings,
            });
        },
    })
}

export default useEditStreamSettings;
