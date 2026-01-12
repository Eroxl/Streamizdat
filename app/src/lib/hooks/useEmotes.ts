import { useQuery } from "@tanstack/react-query";
import { EmoteData, EmotesResponse } from "../types/emote";

const fetchEmotes = async (): Promise<EmoteData[]> => {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/emotes`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch emotes: ${response.statusText}`);
    }

    const data: EmotesResponse = await response.json();

    return data.emotes.map((emote) => ({
        id: emote.id,
        name: emote.name,
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}${data.baseUrl}${emote.filename}`,
        width: emote.width,
        height: emote.height,
    }));
};

const useEmotes = () => {
    return useQuery({
        queryKey: ["emotes"],
        queryFn: fetchEmotes,
    });
};

export default useEmotes;
