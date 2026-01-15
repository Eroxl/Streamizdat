import { fromNodeHeaders } from "better-auth/node";
import { Request } from "express";
import expressWs from "express-ws";
import WebSocket from "ws";

import auth from "../auth";
import { initializeChatApp } from "../lib/chat/chatApp";
import adminVerificationPlugin from "../lib/chat/plugins/adminVerification";
import broadcastMessagePlugin from "../lib/chat/plugins/broadcastMessage";
import embedMiddlewarePlugin from "../lib/chat/plugins/embedCounts";
import hashCashPlugin from "../lib/chat/plugins/hashCash";
import userDisplayPlugin from "../lib/chat/plugins/userDisplay";
import runMiddleware from "../lib/chat/runMiddleware";

export default (app: expressWs.Application) => {
  const chatApp = initializeChatApp();

  chatApp.use(adminVerificationPlugin);
  
  chatApp.use(userDisplayPlugin);
  chatApp.use(embedMiddlewarePlugin);
  chatApp.use(hashCashPlugin);
  chatApp.use(broadcastMessagePlugin);

  app.ws("/ws/chat", async (ws: WebSocket, req: Request) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const user = session?.user ?? {
      name: "Anonymous" + Math.floor(Math.random() * 1000),
    };

    const client = {
      user: user,
      ws: ws,
      state: {},
    }

    chatApp.clients.add(client);

    const connectMiddleware = chatApp.middleware.connect;
    runMiddleware(connectMiddleware, chatApp, client);

    ws.on("message", async function (msg: WebSocket.Data) {
      let parsedMessage: any = null;

      if (msg.toString().includes('{"type":')) {
        parsedMessage = JSON.parse(msg.toString());
      } else {
        parsedMessage = msg.toString()
          .replace(/\\/, "&bsol;")
          .replace(/"/g, "&quot;");
      }

      if (parsedMessage === null) return;

      const messageMiddleware = chatApp.middleware.message;
      runMiddleware(messageMiddleware, parsedMessage, chatApp, client);
    });

    ws.on("close", () => {
      for (const client of chatApp.clients) {
        if (client.ws === ws) {
          chatApp.clients.delete(client);
          break;
        }
      }

      const closeMiddleware = chatApp.middleware.close;
      runMiddleware(closeMiddleware, chatApp, client);
    });
  });
};
