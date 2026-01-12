import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EmoteData, UploadEmoteResponse } from "../types/emote";

type UploadEmotePayload = {
    file: File;
    name: string;
};

const useUploadEmote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, name }: UploadEmotePayload) => {
            const formData = new FormData();
            formData.append("emote", file);
            formData.append("name", name);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/emotes`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to upload emote: ${response.statusText}`);
            }

            const data: UploadEmoteResponse = await response.json();
            return {
                id: data.emote.id,
                name: data.emote.name,
                url: `${process.env.NEXT_PUBLIC_BACKEND_URL}${data.emote.url}`,
                width: data.emote.width,
                height: data.emote.height,
            } as EmoteData;
        },
        onSuccess: (newEmote) => {
            queryClient.setQueryData<EmoteData[]>(["emotes"], (old) => {
                if (!old) return [newEmote];
                // Check if emote with same name exists (replacement case)
                const existingIndex = old.findIndex((e) => e.name === newEmote.name);
                if (existingIndex !== -1) {
                    const updated = [...old];
                    updated[existingIndex] = newEmote;
                    return updated;
                }
                return [...old, newEmote];
            });
        },
    });
};

export type { UploadEmotePayload };

export default useUploadEmote;
