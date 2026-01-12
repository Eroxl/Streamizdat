import { EmoteData } from "@/lib/types/emote";

type ParsedMessage = {
    type: "emote";
    data: EmoteData;
} | {
    type: "text";
    data: string;
} | {
    type: "url";
    data: string;
} | {
    type: "greentext";
    data: string;
} | {
    type: "embed";
    data: string;
}

export const parseMessageWithEmotes = (message: string, emotes: EmoteData[]): ParsedMessage[] => {
    if (!emotes || emotes.length === 0) return [{ type: "text", data: message }];

    const emoteMap = new Map(emotes.map(e => [e.name, e]));
    const parts: ParsedMessage[] = [];
    const words = message.split(/(\s+)/);

    for (const word of words) {
        const emote = emoteMap.get(word);
        if (emote) {
            parts.push({
                type: "emote",
                data: emote
            });
            continue;
        }

        const isContinuingText = parts.length > 0 && typeof parts[parts.length - 1] === 'string';
        if (!isContinuingText) parts.push({ type: "text", data: "" });

        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.type === "text") {
            lastPart.data += word;
        }
    }

    return parts
        .map(part => {
            if (part.type === "text") {
                return {
                    ...part,
                    data: part.data
                        .trim()
                        .replaceAll(/\n{2,}/g, '\n')
                        .replaceAll(/ +/g, ' ')
                };
            }
            return part;
        })
        .flatMap((part) => {
            if (part.type !== "text") return [part];

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const segments = part.data.split(urlRegex);

            return segments.map(segment => {
                if (!urlRegex.test(segment)) {
                    return {
                        type: "text" as const,
                        data: segment
                    };
                }
                
                if (segment.startsWith(`${process.env.NEXT_PUBLIC_APP_DOMAIN}/live?embed=`)) {
                    return {
                        type: "embed" as const,
                        data: segment.split('embed=')[1] 
                    };
                }

                return {
                    type: "url" as const,
                    data: segment
                };
            }) as ParsedMessage[];
        })
        .map(part => {
            if (part.type !== "text" || !part.data.startsWith("> ")) return part;

            return {
                type: "greentext" as const,
                data: part.data
            };
        })
        .filter(part => part.type !== "text" || part.data.length > 0)
};