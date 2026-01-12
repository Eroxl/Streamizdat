import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import { user } from './auth-schema';

export type EmbedAccount = {
    platform: "youtube" | "kick" | "twitch" | "native",
    displayName: string,
    priority: number,
    enabled: boolean,
    channelId: string,
};

export const streamSettings = pgTable(
    "stream_settings",
    {
        id: text("id").primaryKey(),
        
        streamKey: text("stream_key").notNull().unique(),

        title: text("title").notNull(),
        description: text("description").notNull(),

        preferedEmbed: text("preferred_embed").notNull().$type<EmbedAccount["platform"]>(),
        
        personalAccounts: jsonb("personal_accounts").notNull().$type<EmbedAccount[]>(),
        supportedEmbeds: jsonb("supported_embeds").notNull().$type<EmbedAccount[]>(),
    }
);

export const ADMIN_USER_PERMISSIONS = [
    "manage_embeds",
    "manage_emotes",
    "discipline_users",
    "manage_stream_settings",
    "manage_admin_users",
    "super_user",
] as const;

export type AdminUserPermission = typeof ADMIN_USER_PERMISSIONS[number];

export const adminUsers = pgTable(
    "admin_users",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        permissions: jsonb("permissions").notNull().$type<AdminUserPermission[]>(),
    }
);
