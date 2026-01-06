const KICK_API_URL = "https://api.kick.com/public/v1/channels";
const KICK_OAUTH_ENDPOINT = "https://id.kick.com/oauth/token";

type KickWatcherStatus = {
  callback: (status: "live" | "offline", liveUrl: string) => void;
};

class KickWatcher {
  subscribedChannels: Record<string, KickWatcherStatus> = {};
  accessToken: string = "";
  accessExpiry: Date = new Date();

  constructor() {
    this.fetchKickAccessToken();
  }

  async fetchKickAccessToken() {
    if (this.accessToken && new Date() < this.accessExpiry) {
      return;
    }

    const clientId = process.env.KICK_CLIENT_ID || "";
    const clientSecret = process.env.KICK_CLIENT_SECRET || "";

    const response = await fetch(KICK_OAUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch Kick access token: ${response.text()}`
      );
      return;
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.accessExpiry = new Date(Date.now() + data.expires_in);
  }

  subscribe(channelId: string, callback: KickWatcherStatus["callback"]) {
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

  async refreshAllStatuses() {
      await this.fetchKickAccessToken();

      const channelIds = Object.keys(this.subscribedChannels);
      if (channelIds.length === 0) return;

      const statuses = await this.checkStatusForAll(channelIds);

      channelIds.forEach((channelId) => {
        const watcherStatus = this.subscribedChannels[channelId];
        if (!watcherStatus) return;

        const { callback } = watcherStatus;

        const statusInfo = statuses[channelId];

        if (!statusInfo) {
          callback("offline", "");
          return;
        }

        callback(statusInfo.isLive ? "live" : "offline", statusInfo.liveUrl);
      });
  }

  async checkStatus(
    channelId: string
  ): Promise<{ isLive: boolean; liveUrl: string } | null> {
    const statuses = await this.checkStatusForAll([channelId]);

    return statuses[channelId] || { isLive: false, liveUrl: "" };
  }

  async checkStatusForAll(
    channelIds: string[]
  ): Promise<Record<string, { isLive: boolean; liveUrl: string }>> {
    try {
      const url = KICK_API_URL + "?" + channelIds.map(id => 'slug=' + id).join('&');

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      
      if (!response.ok) {
        console.error(
          `Failed to fetch Kick channel data: ${response.statusText}`
        );
        return {};
      }

      const data = await response.json();

      return Object.fromEntries(
        data.data.map((channel: { slug: String; stream: { is_live: boolean } }) => {
          return [channel.slug, {
            isLive: channel.stream.is_live,
            liveUrl: channel.slug,
          }]
        })
      );
    } catch (error) {
      console.error(`Error checking Kick channel status:`, error);
      return {};
    }
  }
}

const kickWatcher = new KickWatcher();

export default kickWatcher;
