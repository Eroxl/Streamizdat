type Embed = {
    enabled: boolean;
    platform: "twitch" | "youtube" | "kick" | "native";
    displayName: string;
    channelId: string;
}

export default Embed;
