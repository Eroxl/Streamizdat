import React from "react";
import { EmoteData } from "@/lib/types/emote";

const EmotePicker: React.FC<{
    emotes: EmoteData[];
    onSelect: (emote: EmoteData) => void;
}> = ({ emotes, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-2 p-2 max-h-64 overflow-y-auto no-scrollbar">
            {emotes.map((emote, index) => (
                <div
                    key={index}
                    className="cursor-pointer"
                    onClick={() => onSelect(emote)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={emote.url}
                        alt={emote.name}
                        title={emote.name}
                        className="inline-block h-8 aspect-auto w-auto"
                        width={emote.width}
                        height={emote.height}
                    />
                </div>
            ))}
        </div>
    );
};

export default EmotePicker;