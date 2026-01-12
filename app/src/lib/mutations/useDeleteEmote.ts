import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteEmoteResponse, EmoteData } from "../types/emote";

const useDeleteEmote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/emotes/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to delete emote: ${response.statusText}`);
            }

            const data: DeleteEmoteResponse = await response.json();
            return data.deleted;
        },
        onSuccess: (deleted) => {
            queryClient.setQueryData<EmoteData[]>(["emotes"], (old) => {
                if (!old) return [];
                return old.filter((emote) => emote.id !== deleted.id);
            });
        },
    });
};

export default useDeleteEmote;
