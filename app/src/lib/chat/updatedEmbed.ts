import { Embed } from "@/lib/hooks/useStreamSettings";
import { LiveEmbed } from "@/types/chat";

export const updatedEmbed = (
    embeds: LiveEmbed[],
    platform: Embed["platform"],
    channelId: string,
    displayName: string,
    embedCount: number,
    embedUrl: string
): LiveEmbed[] => {
    const existingEmbed = embeds.find(
        (embed) => embed.platform === platform && embed.channelId === channelId
    );

    if (existingEmbed) {
        return embeds.map((embed) =>
            embed === existingEmbed
                ? { ...embed, embedCount }
                : embed
        );
    }

    return [
        ...embeds,
        {
            platform,
            channelId,
            displayName,
            embedUrl,
            embedCount,
        },
    ];
};