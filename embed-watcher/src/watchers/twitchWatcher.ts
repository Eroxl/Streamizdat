const Twitch_API_URL = "https://twitch.com/{{CHANNEL_ID}}";

type TwitchWatcherStatus = {
  callback: (status: "live" | "offline", liveUrl: string) => void;
};

class TwitchWatcher {
  subscribedChannels: Record<string, TwitchWatcherStatus> = {};

  async refreshAllStatuses() {
    Object.keys(this.subscribedChannels).forEach(async (channelId) => {
      const { isLive, liveUrl } = await this.checkStatus(channelId);

      const watcherStatus = this.subscribedChannels[channelId];
      if (!watcherStatus) return;

      const { callback } = watcherStatus;

      callback(isLive ? "live" : "offline", liveUrl);
    });
  }

  subscribe(channelId: string, callback: TwitchWatcherStatus["callback"]) {
    if (this.subscribedChannels[channelId]) return;

    this.subscribedChannels[channelId] = { callback };
  }

  unsubscribe(channelId: string) {
    if (!this.subscribedChannels[channelId]) return;

    delete this.subscribedChannels[channelId];
  }

  unSubscribeAll() {
    this.subscribedChannels = {};
  }

  async checkStatus(
    channelId: string
  ): Promise<{ isLive: boolean; liveUrl: string }> {
    try {
      const watcherStatus = this.subscribedChannels[channelId];
      if (!watcherStatus) return { isLive: false, liveUrl: "" };

      const url = Twitch_API_URL.replace("{{CHANNEL_ID}}", channelId);
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Failed to fetch Twitch channel page for ${channelId}: ${response.statusText}`
        );
        return { isLive: false, liveUrl: "" };
      }

      const rawHtml = await response.text();
      const isLive = rawHtml.includes("isLiveBroadcast");

      return { isLive, liveUrl: channelId };
    } catch (error) {
      console.error(
        `Error checking Twitch channel status for ${channelId}:`,
        error
      );
      return { isLive: false, liveUrl: "" };
    }
  }
}

const twitchWatcher = new TwitchWatcher();

export default twitchWatcher;
