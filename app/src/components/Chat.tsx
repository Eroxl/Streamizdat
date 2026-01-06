"use client";

import { Embed } from "@/lib/hooks/useStreamSettings";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const MAX_RECONNECT_ATTEMPTS = 5;

type ChatUser = {
    name: string;
    color: string;
    badges: string[];
};

type ChatMessageType = "you" | "other" | "system";

type ChatMessage = {
    user: ChatUser;
    type: ChatMessageType;
    message: string;
}

const ChatMessage: React.FC<{
    message: ChatMessage
}> = ({ message }) => {
    const { user, type } = message

    return (
        <div className="text-wrap break-words">
            <span className="inline-flex items-center mr-1">
                {user.badges.map((badge, index) => (
                    <Image
                        key={index}
                        src={`/badges/${badge}.svg`}
                        alt={badge}
                        className="w-4 h-4 mr-1 align-text-bottom inline rounded"
                        width={16}
                        height={16}
                    />
                ))}
                <strong style={{ color: user.color }}>{user.name}:</strong>{" "}
            </span>
            <span>{message.message
                .replaceAll("&bsol;", "\\")
                .replaceAll("&quot;", "\"")
            }</span>
    </div>
    );
};

const updatedEmbed = (embeds: {
    platform: Embed["platform"];
    channelId: string;
    displayName: string;
    embedCount: number;
    embedUrl: string;
}[], platform: Embed["platform"], channelId: string, displayName: string, embedCount: number, embedUrl: string) => {
    const existingEmbed = embeds.find(
        (embed) => embed.platform === platform && embed.channelId === channelId
    );

    if (existingEmbed) {
        return embeds.map((embed) =>
            embed === existingEmbed
                ? { ...embed, embedCount: embedCount }
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
            embedCount: embedCount,
        },
    ];
}

const Chat: React.FC<{ readonly?: boolean }> = ({ readonly = false }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInfo, setUserInfo] = useState<ChatUser | null>(null);
    const [embeds, setEmbeds] = useState<{
        platform: Embed["platform"];
        channelId: string;
        displayName: string;
        embedCount: number;
        embedUrl: string;
    }[]>([]);
    const [input, setInput] = useState<string>("");
    const chatRef = useRef<HTMLDivElement | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef<number>(0);
    const searchParams = useSearchParams();
    const embed = searchParams.get("embed");
    const broadcastedEmbed = useRef<string | null>(null);
    
    useEffect(() => {
        if (!embed || embed === broadcastedEmbed.current) return;
        broadcastedEmbed.current = embed;
        
        const [platform, embedUrl] = embed.split("/");

        const broadcastEmbed = () => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                setTimeout(broadcastEmbed, 500);
                return;
            }

            ws.current.send(JSON.stringify({ type: "embed", data: {
                platform,
                embedUrl, 
            }}));
        }

        broadcastEmbed();
    }, [embed, embeds]);

    useEffect(() => {
        const connectWebSocket = () => {
            if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

            ws.current = new WebSocket("ws://localhost:4000/ws/chat");
            
            ws.current.onmessage = (event) => {
                const messageData = JSON.parse(event.data);
                if (messageData.type === "recentMessages") {
                    setMessages(messageData.data);
                } else if (messageData.type === "newMessage") {
                    setMessages((prevMessages) => [...prevMessages, messageData.data]);
                } else if (messageData.type === "userInfo") {
                    setUserInfo(messageData.data);
                } else if (messageData.type === "initialLiveEmbeds") {
                    setEmbeds(messageData.data);
                } else if (messageData.type === "embedStatusChange") {
                    if (messageData.data.status === "live") {
                        setEmbeds((prevEmbeds) => 
                            updatedEmbed(
                                prevEmbeds,
                                messageData.data.platform,
                                messageData.data.channelId,
                                messageData.data.displayName,
                                messageData.data.embedCount,
                                messageData.data.embedUrl,
                            )
                        );
                    } else if (messageData.data.status === "offline") {
                        setEmbeds((prevEmbeds) => 
                            prevEmbeds
                                .map((embed) =>
                                    embed.platform === messageData.data.platform &&
                                    embed.channelId === messageData.data.channelId
                                        ? { ...embed, embedCount: Math.max(0, embed.embedCount - 1) }
                                        : embed
                                )
                        );
                    }
                } else if (messageData.type === "embedCountUpdate") {
                    setEmbeds((prevEmbeds) =>
                        prevEmbeds.map((embed) =>
                            embed.platform === messageData.data.platform &&
                            embed.channelId === messageData.data.channelId
                                ? { ...embed, embedCount: messageData.data.embedCount }
                                : embed
                        )
                    );
                }
            };

            ws.current.onclose = () => {
                if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return;

                const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
                setTimeout(() => {
                    reconnectAttempts.current += 1;
                    connectWebSocket();
                }, timeout);
            };
        }

        connectWebSocket();

        return () => {
            ws.current?.close();
        }
    }, []);

    useEffect(() => {
        if (!chatRef.current) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const sendMessage = () => {
        if (!ws.current || input.trim() == "") return;

        ws.current.send(input);
        setInput("");
        setMessages((prevMessages) => [...prevMessages, { user: userInfo!, type: "you", message: input }]);
    };

    return (
        <div className="h-full w-full flex relative flex-col bg-black/10 overflow-hidden">
            {
                !readonly && (
                    <div className="w-full bg-nord0 h-10 shrink-0">
                        <div className="overflow-x-scroll flex h-full items-center gap-2 no-scrollbar px-2">
                        {
                            embeds.sort((a, b) => b.embedCount - a.embedCount).map((embed, index) => (
                                <Link
                                    key={index}
                                    className={`px-3 py-1 shrink-0 grow-0 ${searchParams.get("embed") === `${embed.platform}/${embed.embedUrl}` ? "opacity-100" : "opacity-50"} transition-all hover:opacity-100 flex items-center gap-1 text-sm text-nowrap text-nord6 hover:bg-white/5 rounded p-2`}
                                    href={searchParams.get("embed") == `${embed.platform}/${embed.embedUrl}` ? "/live" : `/live?embed=${embed.platform}/${embed.embedUrl}`}
                                >
                                    <Image
                                        src={`/icons/${embed.platform}.svg`}
                                        alt={embed.platform}
                                        className="w-4 h-4 mr-1 align-text-bottom inline"
                                        width={20}
                                        height={20}
                                    />
                                    <span className="text-nowrap text-sm w-full flex items-center justify-center">
                                        {embed.displayName}
                                    </span>
                                    <span className="text-nord3 opacity-50">({embed.embedCount})</span>
                                </Link>
                            ))
                        }
                        </div>
                    </div>
                )
            }
            <div className="flex-1 min-h-0 overflow-y-auto w-full px-4 pt-2 pb-0 no-scrollbar" ref={chatRef}>
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
            </div>
            {!readonly &&
                (
                    <div className="shrink-0 flex flex-col gap-4 px-4 pb-4">
                        {
                            userInfo && (
                                <p className="text-xs text-nord3 mt-1 opacity-50">
                                    You are currently chatting as{" "}
                                    <strong style={{ color: userInfo?.color }}>{userInfo?.name}</strong>.{" "}
                                    {
                                        userInfo?.name.startsWith("Anonymous") && (
                                            <span>
                                                To set a custom name, please <Link href="/login" className="underline text-nord5">login</Link>.
                                            </span>
                                        )
                                    }
                                </p>
                            )
                        }

                        <input
                            type="text"
                            className="w-full bg-white/5 p-2 focus:outline-none rounded placeholder:text-white/5"
                            placeholder={"Type your message..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyUp={(e) => {
                                if (e.key !== 'Enter') return;

                                sendMessage();
                            }}
                        />
                    </div>
                )
            }
        </div>
    );
};

export default Chat;
