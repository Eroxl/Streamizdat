import { User } from "better-auth";
import expressWs from "express-ws";
import WebSocket from "ws";
import { Request } from "express";
import { fromNodeHeaders } from "better-auth/node";
import auth from "../auth";
import redisClientSubscribe from "../db/redisClientSubscribe";
import getUserDisplay from "../lib/chat/getUserDisplay";

const chatClients: Set<{
  user:
    | User
    | {
        name: string;
      };
  ws: WebSocket;
}> = new Set();

const recentMessages: {
  user: {
    name: string;
    color: string;
    badges: string[];
  };
  message: string;
}[] = [];

const liveEmbeds: Map<
  string,
  {
    platform: string;
    channelId: string;
    embedUrl: string;
    displayName: string;
  }
> = new Map();

const embedUrlToChannelId: Map<string, string> = new Map();

const embedCounts = new Map<string, number>();

const getEmbedKey = (channelId: string, platform: string) => {
  return platform + ":" + channelId;
};

redisClientSubscribe.subscribe("stream_status", (message: string) => {
  const parsedMessage = JSON.parse(message) as {
    platform: string;
    channelId: string;
    displayName: string;
    status: "live" | "offline";
    embedUrl: string;
  };

  chatClients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    client.ws.send(
      JSON.stringify({
        type: "embedStatusChange",
        data: {
          platform: parsedMessage.platform,
          channelId: parsedMessage.channelId,
          embedUrl: parsedMessage.embedUrl,
          displayName: parsedMessage.displayName,
          embedCount:
            embedCounts.get(
              getEmbedKey(parsedMessage.channelId, parsedMessage.platform)
            ) || 0,
          status: parsedMessage.status,
        },
      })
    );
  });

  if (parsedMessage.status === "live") {
    liveEmbeds.set(
      getEmbedKey(parsedMessage.channelId, parsedMessage.platform),
      {
        platform: parsedMessage.platform,
        channelId: parsedMessage.channelId,
        embedUrl: parsedMessage.embedUrl,
        displayName: parsedMessage.displayName,
      }
    );
    
    embedUrlToChannelId.set(
      parsedMessage.embedUrl,
      parsedMessage.channelId,
    );
  } else {
    liveEmbeds.delete(
      getEmbedKey(parsedMessage.channelId, parsedMessage.platform)
    );
    
    embedUrlToChannelId.delete(
      parsedMessage.embedUrl,
    );
  }
});

export default (app: expressWs.Application) => {
  app.ws("/ws/chat", async (ws: WebSocket, req: Request) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const user = session?.user ?? {
      name: "Anonymous" + Math.floor(Math.random() * 1000),
    };

    const [userColor, userBadges] = await getUserDisplay(user);

    chatClients.add({
      user: user,
      ws: ws,
    });

    ws.send(JSON.stringify({ type: "recentMessages", data: recentMessages }));
    ws.send(
      JSON.stringify({
        type: "userInfo",
        data: { name: user.name, color: userColor, badges: userBadges },
      })
    );
    ws.send(
      JSON.stringify({
        type: "initialLiveEmbeds",
        data: Array.from(liveEmbeds.entries()).map(([key, embed]) => {
          const [platform, channelId] = key.split(":");

          return {
            platform,
            channelId,
            embedUrl: embed.embedUrl,
            displayName: embed.displayName,
            embedCount: embedCounts.get(key) || 0,
          };
        }),
      })
    );

    let embededChannel: string | null = null;

    ws.on("message", function (msg: WebSocket.Data) {
      if (msg.toString().includes('{"type":')) {
        console.log(msg);
        if (session === null) return;
    
        const parsed = JSON.parse(msg.toString());

        if (parsed.type === "embed") {
          const { platform, embedUrl } = parsed.data;
          const channelId = (platform === "youtube" ? embedUrlToChannelId.get(embedUrl) : embedUrl);
          const key = platform + ":" + channelId;

          if (embededChannel !== null) {
            const previousCount = embedCounts.get(embededChannel) || 1;
            embedCounts.set(embededChannel, previousCount - 1);
          
            const [previousPlatform, previousChannelId] = embededChannel.split(":");
            chatClients.forEach((client) => {
              if (!embededChannel) return;

              if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(
                  JSON.stringify({
                    type: "embedCountUpdate",
                    data: {
                      platform: previousPlatform,
                      channelId: previousChannelId,
                      embedCount: previousCount - 1,
                    },
                  })
                );
              }
            });
          }

          embedCounts.set(key, (embedCounts.get(key) || 0) + 1);
          embededChannel = key;

          chatClients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(
                JSON.stringify({
                  type: "embedCountUpdate",
                  data: {
                    platform: platform,
                    channelId: channelId,
                    embedCount: embedCounts.get(key) || 0,
                  },
                })
              );
            }
          });

          return;
        }
      }

      const message = msg.toString()
        .replace(/\\/, "&bsol;")
        .replace(/"/g, "&quot;");

      recentMessages.push({
        user: {
          name: user.name,
          color: userColor,
          badges: userBadges,
        },
        message: message,
      });

      if (recentMessages.length > 50) recentMessages.shift();

      chatClients.forEach((client) => {
        if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(
            JSON.stringify({
              type: "newMessage",
              data: {
                user: {
                  name: user.name,
                  color: userColor,
                  badges: userBadges,
                },
                message: message,
              },
            })
          );
        }
      });
    });

    ws.on("close", () => {
      chatClients.forEach((client) => {
        if (client.ws !== ws) return;

        chatClients.delete(client);

        if (embededChannel !== null) {
          const previousCount = embedCounts.get(embededChannel) || 1;
          embedCounts.set(embededChannel, previousCount - 1);

          const [previousPlatform, previousChannelId] = embededChannel.split(":");
          chatClients.forEach((otherClient) => {
            if (!embededChannel) return;

            if (otherClient.ws !== ws && otherClient.ws.readyState === WebSocket.OPEN) {
              otherClient.ws.send(
                JSON.stringify({
                  type: "embedCountUpdate",
                  data: {
                    platform: previousPlatform,
                    channelId: previousChannelId,
                    embedCount: previousCount - 1,
                  },
                })
              );
            }
          });
        }
      });
    });
  });
};
