"use client";

import Image from "next/image";
import { EmoteData } from "@/lib/types/emote";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface EmoteCardProps {
    emote: EmoteData;
    canManage: boolean;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
}

export function EmoteCard({ emote, canManage, onDelete, isDeleting }: EmoteCardProps) {
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="bg-nord1 rounded-lg p-3 w-full aspect-square flex flex-col items-center gap-2 relative group">
            <div className="h-12 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={emote.url}
                    alt={emote.name}
                    title={emote.name}
                    width={emote.width}
                    height={emote.height}
                    className="max-w-12"
                />
            </div>
            <span className="text-sm text-nord4 truncate w-full text-center" title={emote.name}>
                {emote.name}
            </span>
            <span className="text-xs text-nord4/50">
                {emote.width}x{emote.height}
            </span>

            {canManage && (
                <>
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="absolute top-2 right-2 p-1 rounded bg-nord2 hover:bg-nord11 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete emote"
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="absolute inset-0 bg-nord0/95 rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                            <span className="text-xs text-center">Delete?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onDelete(emote.id)}
                                    disabled={isDeleting}
                                    className="px-2 py-1 text-xs bg-nord11 hover:bg-nord11/80 rounded transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? "..." : "Yes"}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isDeleting}
                                    className="px-2 py-1 text-xs bg-nord3 hover:bg-nord2 rounded transition-colors"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
