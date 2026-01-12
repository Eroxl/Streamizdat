import { User } from "better-auth";
import { eq } from "drizzle-orm";

import db from "../../db/db";
import { adminUsers } from "../../db/schemas/settings-schema";

const BADGES = {
  STREAMER: "streamer",
  MODERATOR: "moderator",
}

const USER_COLORS = {
  ANONYMOUS: "#434c5e",
  DEFAULT_USER: "#4c566a",

  STREAMER: "#bf616a",
  MODERATOR: "#a3be8c",
}

type UserDisplay = [string, string[]];

const getUserDisplay = async (user: User | { name: string, id?: null }): Promise<UserDisplay> => {
  if (!user.id) return [USER_COLORS.ANONYMOUS, []];

  let color = null;
  let badges: string[] = [];

  const adminRecord = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, user.id))
    .limit(1)
    .then((res) => res[0]);

  if (adminRecord?.permissions.includes("super_user")) {
    color = color || USER_COLORS.STREAMER;
    badges.push(BADGES.STREAMER);
  } else if (adminRecord) {
    color = color || USER_COLORS.MODERATOR;
    badges.push(BADGES.MODERATOR);
  }

  return [
    color || USER_COLORS.DEFAULT_USER,
    badges,
  ]
};

export default getUserDisplay;
