import { ChatPlugin, ConnectMiddlewareFn } from "../chatApp";

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

const userDisplayMiddleware: ConnectMiddlewareFn = async (_, client, next) => {
    let color = null;
    let badges: string[] = [];

    if (!("id" in client.user)) {
      color = USER_COLORS.ANONYMOUS;
    }

    if (client.state["isAdmin"] === true) {
      color = USER_COLORS.MODERATOR;
      badges.push(BADGES.MODERATOR);
    }

    if (client.state["roles"] && Array.isArray(client.state["roles"])) {
      const roles = client.state["roles"] as string[];
      
      if (roles.includes("super_user")) {
        color = USER_COLORS.STREAMER;
        badges.push(BADGES.STREAMER);
      }
    }

    client.state["userDisplay"] = {
        name: client.user.name,
        color: color,
        badges: badges,
    };

    client.ws.send(
      JSON.stringify({
        type: "userInfo",
        data: { name: client.user.name, color: color, badges: badges },
      })
    );

    next();
}

const userDisplayPlugin: ChatPlugin = {
    middleware: {
      connect: [userDisplayMiddleware],
    },
};

export default userDisplayPlugin;