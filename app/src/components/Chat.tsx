"use client";

import { Embed } from "@/lib/hooks/useStreamSettings";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import useEmotes from "@/lib/hooks/useEmotes";
import AutoHeightInput from "./AutoHeightInput";
import { Smile, X } from "lucide-react";
import { ChatMessage, LiveEmbed, ChatUser } from "@/types/chat";
import { updatedEmbed } from "@/lib/chat/updatedEmbed";
import EmoteAutoComplete from "./chat/EmoteAutoComplete";
import EmotePicker from "./chat/EmotePicker";
import ChatMessageComponent from "./chat/ChatMessage";

const MAX_RECONNECT_ATTEMPTS = 5;

const Chat: React.FC<{ readonly?: boolean }> = ({ readonly = false }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInfo, setUserInfo] = useState<ChatUser | null>(null);
    const [embeds, setEmbeds] = useState<LiveEmbed[]>([]);
    const [input, setInput] = useState<string>("");
    const chatRef = useRef<HTMLDivElement | null>(null);
    const { data: emotes = [] } = useEmotes();
    const ws = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef<number>(0);
    const searchParams = useSearchParams();
    const embed = searchParams.get("embed");
    const broadcastedEmbed = useRef<string | null>(null);
    const emoteMenuButtonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const [isEmotePickerOpen, setIsEmotePickerOpen] = useState<boolean>(false);

    useEffect(() => {
        const parsedEmbed = embed || "default/default";

        if (parsedEmbed === broadcastedEmbed.current) return;
        broadcastedEmbed.current = parsedEmbed;

        const [platform, embedUrl] = parsedEmbed.split("/");

        const broadcastEmbed = () => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                setTimeout(broadcastEmbed, 500);
                return;
            }

            ws.current.send(JSON.stringify({
                type: "embed", data: {
                    platform,
                    embedUrl,
                }
            }));
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
                    <ChatMessageComponent
                        key={index}
                        message={msg}
                        emotes={emotes}
                        embeds={embeds}
                    />
                ))}
            </div>
            {!readonly &&
                (
                    <div className="shrink-0 flex flex-col px-4 gap-2 pb-4"> 
                        <div className="flex gap-2 h-min relative">
                            <AutoHeightInput
                                ref={inputRef}
                                className={`w-full bg-white/5 p-2 focus:outline-none ${isEmotePickerOpen ? "rounded-b" :  "rounded"} min-h-[40px] h-[40px] placeholder:text-white/5`}
                                placeholder={"Type your message..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyUp={(e) => {
                                    if (e.key !== 'Enter' || e.shiftKey) return;

                                    e.preventDefault();

                                    sendMessage();
                                    return true;
                                }}
                            />
                            <EmoteAutoComplete
                                emotes={emotes}
                                currentInput={input}
                                onSelect={(emote) => {
                                    setInput((prev) => {
                                        const searchTerm = prev.split(" ").pop() || "";
                                        const updatedInput = prev.slice(0, prev.length - searchTerm.length);

                                        const space = updatedInput.length === 0 || updatedInput.endsWith(" ") ? "" : " ";
                                        setTimeout(() => {
                                            if (!inputRef.current) return;

                                            inputRef.current.focus();
                                        }, 0);
                                        return updatedInput + space + emote.name + " ";
                                    });
                                }}
                            />
                            {
                                isEmotePickerOpen && emoteMenuButtonRef.current && (
                                    <div
                                        className="absolute bottom-full left-0 right-0 rounded-t bg-nord-dark"
                                    >
                                        <div className="bg-black/10 rounded-t w-full">
                                            <div className="bg-white/5 rounded-t w-full p-2">
                                                <div className="flex justify-between">
                                                    <span className="text-nord6 font-semibold">Select an Emote</span>
                                                    <button
                                                        className="hover:bg-white/5 aspect-square h-6 flex items-center justify-center rounded p-1"
                                                        onClick={() => setIsEmotePickerOpen(false)}
                                                    >
                                                        <X className="w-4 h-4 text-white/50 ml-auto" />
                                                    </button>
                                                </div>
                                                <EmotePicker
                                                    emotes={emotes}
                                                    onSelect={(emote) => {
                                                        setInput((prev) => {
                                                            const space = prev.length === 0 || prev.endsWith(" ") ? "" : " ";
                                                            
                                                            setTimeout(() => {
                                                                if (!inputRef.current) return;

                                                                inputRef.current.focus();
                                                            }, 0);

                                                            return prev + space + emote.name + " ";
                                                        });

                                                        setIsEmotePickerOpen(false);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div>

                        <div className="h-[24px] flex items-center gap-2 w-full">
                            <button
                                className="hover:bg-white/5 aspect-square h-full flex items-center justify-center rounded"
                                onClick={() => setIsEmotePickerOpen(!isEmotePickerOpen)}
                                ref={emoteMenuButtonRef}
                            >
                                <Smile className="w-4 h-4 text-white/50" />
                            </button>
                            {
                                userInfo && (
                                    <p className="text-xs text-nord3 mt-1 opacity-50 ml-auto">
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
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default Chat;
