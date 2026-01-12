"use client";

import { ChevronDown, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface AddEmoteProps {
    onAdd: (file: File, name: string) => void;
    isUploading?: boolean;
    error?: string | null;
}

const EMOTE_NAME_REGEX = /^[a-zA-Z0-9_-]{2,32}$/;
const ACCEPTED_FILE_TYPES = ".webp,.png,.jpg,.jpeg,.gif";
const MAX_FILE_SIZE = 512 * 1024; // 512KB

export function AddEmote({ onAdd, isUploading, error }: AddEmoteProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setValidationError(null);

        if (!selectedFile) {
            setFile(null);
            setPreview(null);
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setValidationError("File too large. Max 512KB.");
            setFile(null);
            setPreview(null);
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));

        // Auto-fill name from filename if empty
        if (!name) {
            const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
            const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "");
            if (sanitized.length >= 2 && sanitized.length <= 32) {
                setName(sanitized);
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setValidationError(null);
    };

    const validateAndSubmit = () => {
        if (!file) {
            setValidationError("Please select an image file.");
            return;
        }

        if (!name) {
            setValidationError("Please enter an emote name.");
            return;
        }

        if (!EMOTE_NAME_REGEX.test(name)) {
            setValidationError(
                "Name must be 2-32 characters, alphanumeric, underscores, or hyphens only."
            );
            return;
        }

        onAdd(file, name);
    };

    const resetForm = () => {
        setFile(null);
        setPreview(null);
        setName("");
        setValidationError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-nord0 rounded-md overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-nord1 transition-colors"
            >
                <span className="font-medium">Add New Emote</span>
                <ChevronDown
                    className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 flex flex-col gap-4">
                    {/* File Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-nord4/70">Image File</label>
                        <div className="flex items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_FILE_TYPES}
                                onChange={handleFileChange}
                                className="hidden"
                                id="emote-file-input"
                            />
                            <label
                                htmlFor="emote-file-input"
                                className="flex items-center gap-2 px-4 py-2 bg-nord2 hover:bg-nord3 rounded-lg cursor-pointer transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm">Choose File</span>
                            </label>
                            {file && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-nord4/70 truncate max-w-[200px]">
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={handleClearFile}
                                        className="p-1 hover:bg-nord2 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-nord4/50">
                            WebP, PNG, JPEG, or GIF. Max 512KB. Will be resized to 32px height.
                        </span>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-nord4/70">Preview (original size)</label>
                            <div className="bg-nord1 p-4 rounded-lg inline-flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview}
                                    alt="Emote preview"
                                    className="max-w-[256px] max-h-[256px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-nord4/70">Emote Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g., Kappa"
                            className="px-3 py-2 bg-nord1 border border-nord2 rounded-lg focus:outline-none focus:border-nord8 text-white"
                            maxLength={32}
                        />
                        <span className="text-xs text-nord4/50">
                            2-32 characters. Alphanumeric, underscores, and hyphens only.
                        </span>
                    </div>

                    {/* Error Display */}
                    {(validationError || error) && (
                        <div className="text-sm text-nord11">
                            {validationError || error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={validateAndSubmit}
                            disabled={isUploading || !file || !name}
                            className="px-4 py-2 bg-nord14 hover:bg-nord7 disabled:opacity-50 disabled:hover:bg-nord14 rounded-lg transition-colors text-sm font-medium"
                        >
                            {isUploading ? "Uploading..." : "Upload Emote"}
                        </button>
                        <button
                            onClick={resetForm}
                            disabled={isUploading}
                            className="px-4 py-2 bg-nord3 hover:bg-nord2 rounded-lg transition-colors text-sm"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
