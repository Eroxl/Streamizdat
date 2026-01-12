export interface Emote {
    id: string;
    name: string;
    filename: string;
    width: number;
    height: number;
    uploadedBy: string;
    createdAt: Date;
}

export interface EmoteData {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
}

export interface EmotesResponse {
    emotes: Array<{
        id: string;
        name: string;
        filename: string;
        width: number;
        height: number;
        createdAt: string;
    }>;
    baseUrl: string;
}

export interface UploadEmoteResponse {
    message: string;
    emote: {
        id: string;
        name: string;
        filename: string;
        width: number;
        height: number;
        url: string;
    };
}

export interface DeleteEmoteResponse {
    message: string;
    deleted: {
        id: string;
        name: string;
    };
}
