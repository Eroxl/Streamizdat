import React, { useEffect, useMemo, useState } from "react";
import { EmoteData } from "@/lib/types/emote";

const EmoteAutoComplete: React.FC<{
    emotes: EmoteData[];
    onSelect: (emote: EmoteData) => void;
    currentInput: string;
}> = ({ emotes, onSelect, currentInput }) => {
    const [isMenuHidden, setIsMenuHidden] = useState<boolean>(false);

    const matchingEmotes = useMemo(() => {
        if (currentInput.trim() === "") return [];

        if (currentInput.endsWith(" ")) setIsMenuHidden(false);

        const searchTerm = currentInput.split(" ").pop() || "";
        if (searchTerm.length === 0) return [];

        return emotes
            .filter(emote =>
                emote.name.toLowerCase().startsWith(searchTerm.toLowerCase())
            )
            .slice(0, 5);
    }, [currentInput, emotes, isMenuHidden]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab" || matchingEmotes.length === 0) return;

            e.preventDefault();
            onSelect(matchingEmotes[0]);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [matchingEmotes, onSelect]);

    if (matchingEmotes.length === 0 || isMenuHidden) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 rounded bg-black/5 mb-1">
            <div className="flex gap-2 p-2 max-h-64 overflow-y-auto no-scrollbar">
                {matchingEmotes.map((emote, index) => (
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
                            className="inline-block h-8 w-auto"
                            width={emote.width}
                            height={emote.height}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmoteAutoComplete;