import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from './auth-schema';

export const emotes = pgTable(
    "emotes",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull().unique(),
        
        filename: text("filename").notNull().unique(),
        
        width: integer("width").notNull(),
        height: integer("height").notNull(),
        
        uploadedBy: text("uploaded_by")
            .notNull()
            .references(() => user.id, { onDelete: "set null" }),
        createdAt: timestamp("created_at").notNull().defaultNow(),
    }
);

export type Emote = typeof emotes.$inferSelect;
export type NewEmote = typeof emotes.$inferInsert;
