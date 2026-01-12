import React, { useMemo } from "react";
import Image from "next/image";
import { ChatMessage, LiveEmbed } from "@/types/chat";
import { EmoteData } from "@/lib/types/emote";
import { parseMessageWithEmotes } from "@/lib/chat/parseMessageWithEmotes";
import Link from "next/link";

const EmbedMessage: React.FC<{
    fullUrl: string;
    embeds: LiveEmbed[];
}> = ({ fullUrl, embeds }) => {
    const [platform, embedUrl] = decodeURIComponent(fullUrl).split("/");
    const existingEmbed = embeds.find(
        (embed) => embed.platform === platform && embed.embedUrl === embedUrl
    );

    return (
        <Link
            className="text-nord10 underline"
            href={`${process.env.NEXT_PUBLIC_APP_DOMAIN}/live?embed=${platform}/${embedUrl}`}
        >
            {
                existingEmbed
                    ? `${existingEmbed.displayName} (${existingEmbed.embedCount})`
                    : fullUrl
            }
        </Link>
    )
}

const ChatMessageComponent: React.FC<{
    message: ChatMessage;
    emotes: EmoteData[];
    embeds: LiveEmbed[];
}> = ({ message, emotes, embeds }) => {
    const { user } = message;

    const parsedMessage = useMemo(() => {
        const decodedMessage = message.message
            .replaceAll("&bsol;", "\\")
            .replaceAll("&quot;", "\"");
        return parseMessageWithEmotes(decodedMessage, emotes);
    }, [message.message, emotes]);

    return (
        <div className="text-wrap break-words">
            <span className="inline items-center mr-1">
                {user.badges.map((badge, index) => (
                    <Image
                        key={index}
                        src={`/badges/${badge}.svg`}
                        title={badge.replaceAll("_", " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                        alt={badge}
                        className="w-4 h-4 mr-1 align-middle inline rounded"
                        width={16}
                        height={16}
                    />
                ))}
                <strong style={{ color: user.color }}>{user.name}:</strong>{" "}
            </span>
            {parsedMessage.map((part, index) => {
                if (part.type === "text") {
                    return <React.Fragment key={index}>{part.data}</React.Fragment>;
                } else if (part.type === "emote") {
                    return (
                        <span className="inline-block mr-0.5 h-8 w-auto" key={index}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={part.data.url}
                                alt={part.data.name}
                                title={part.data.name}
                                className="inline-block h-8 w-auto"
                                width={part.data.width}
                                height={part.data.height}
                            />
                        </span>
                    );
                } else if (part.type === "url") {
                    return (
                        <a
                            key={index}
                            href={part.data}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-nord10 underline"
                        >
                            {part.data}
                        </a>
                    );
                } else if (part.type === "greentext") {
                    return (
                        <span key={index} className="text-nord14">
                            {part.data}
                        </span>
                    );
                } else if (part.type === "embed") {
                    return (
                        <EmbedMessage
                            key={index}
                            fullUrl={part.data}
                            embeds={embeds}
                        /> 
                    );
                }

                return null;
            })}
        </div>
    );
};

export default ChatMessageComponent;