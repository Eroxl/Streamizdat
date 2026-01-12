import { Embed } from "@/lib/hooks/useStreamSettings";

export type ChatUser = {
    name: string;
    color: string;
    badges: string[];
};

export type ChatMessageType = "you" | "other" | "system";

export type ChatMessage = {
    user: ChatUser;
    type: ChatMessageType;
    message: string;
};

export type LiveEmbed = {
    platform: Embed["platform"];
    channelId: string;
    displayName: string;
    embedCount: number;
    embedUrl: string;
};