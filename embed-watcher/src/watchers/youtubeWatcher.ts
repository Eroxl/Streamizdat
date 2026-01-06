const YOUTUBE_API_URL = "https://youtube.com/channel/{{CHANNEL_ID}}/live";

type YoutubeWatcherStatus = {
  callback: (status: "live" | "offline", liveUrl: string) => void;
};

class YouTubeWatcher {
  subscribedChannels: Record<string, YoutubeWatcherStatus> = {};

  async refreshAllStatuses() {
    Object.keys(this.subscribedChannels).forEach(async (channelId) => {
      const { isLive, liveUrl } = await this.checkStatus(channelId);

      const watcherStatus = this.subscribedChannels[channelId];
      if (!watcherStatus) return;

      const { callback } = watcherStatus;

      callback(isLive ? "live" : "offline", liveUrl);
    });
  }

  subscribe(channelId: string, callback: YoutubeWatcherStatus["callback"]) {
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

      const url = YOUTUBE_API_URL.replace("{{CHANNEL_ID}}", channelId);
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Failed to fetch YouTube channel page for ${channelId}: ${response.statusText}`
        );
        return { isLive: false, liveUrl: "" };
      }

      const rawHtml = await response.text();
      const redirectMatch = rawHtml.match(
        /\<link rel="canonical" href="(.+?)"\>/gm
      );

      if (!redirectMatch || redirectMatch.length === 0) {
        console.error(
          `Failed to find canonical link in YouTube channel page for ${channelId}`
        );
        return { isLive: false, liveUrl: "" };
      }

      if (!redirectMatch[0].includes("/watch?v=")) {
        return { isLive: false, liveUrl: "" };
      }

      return {
        isLive: true,
        liveUrl: redirectMatch[0].split('"')[3].split("/watch?v=")[1],
      };
    } catch (error) {
      console.error(`Error checking YouTube status for ${channelId}:`, error);
      return { isLive: false, liveUrl: "" };
    }
  }
}

const youtubeWatcher = new YouTubeWatcher();

export default youtubeWatcher;
