import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import bodyParser from "body-parser";

import auth from "./auth";
import db from "./db/db";
import redisClientPublish from "./db/redisClientPublish";
import { ADMIN_USER_PERMISSIONS, adminUsers, streamSettings } from "./db/schemas/settings-schema";

const PORT = process.env.PORT || 8081;

const { app } = expressWs(express());


app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(bodyParser.json());

app.all("/auth/*splat", toNodeHandler(auth));

if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
  try {
    const response = await auth.api.signUpEmail({
      body: {
        email: `${process.env.ADMIN_USERNAME}@anonymous.streamizdat.com`,
        password: process.env.ADMIN_PASSWORD,
        username: process.env.ADMIN_USERNAME,
        name: process.env.ADMIN_USERNAME,
      },
    });

    if (!response.token) {
      throw new Error("Admin user creation failed");
    }

    const userId = response.user.id;

    await db.insert(adminUsers).values({
      id: crypto.randomUUID(),
      userId: userId,
      permissions: ADMIN_USER_PERMISSIONS as any,
    });

    await db
        .insert(streamSettings)
        .values({
            id: "default",
            streamKey: crypto.randomUUID(),
            title: 'Untitled Stream',
            description: 'My first stream',
            preferedEmbed: 'native',
            personalAccounts: [{
              channelId: process.env.ADMIN_USERNAME,
              displayName: process.env.ADMIN_USERNAME,
              enabled: true,
              platform: 'native',
              priority: 99,
            }],
            supportedEmbeds: [],
        })
  } catch (error) {
    console.log("Admin user already exists, skipping creation.");
  }
} else {
  console.warn(
    "Admin credentials are not set! Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables for security."
  );
}

redisClientPublish.publish("server_events", JSON.stringify({
  type: "server_restart",
  timestamp: Date.now(),
}));

import requireAdmin from "./middleware/requireAdmin";

import chatRouter from "./websockets/chat";
import adminRouter from './admin';
import emotesRouter from './emotes';

chatRouter(app);

app.use('/emotes', emotesRouter);
app.use('/admin', requireAdmin, adminRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
