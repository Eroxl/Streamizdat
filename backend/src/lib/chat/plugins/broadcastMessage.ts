import { ChatMiddlewareFn, ChatPlugin } from "../chatApp";

const broadcastMessageMiddleware: ChatMiddlewareFn = (message, chatApp, client, next) => {
    if (typeof message !== "string") return next();

    const userDisplay = client.state.userDisplay;

    chatApp.broadcast(
        {
            type: "newMessage",
            data: {
                user: userDisplay,
                message: message,
            }
        },
        [client.ws]
    );

    next();
}

/**
 * Broadcast all chat messages to all connected clients except the sender.
 */
const broadcastMessagePlugin: ChatPlugin = {
    middleware: {
        message: [broadcastMessageMiddleware],
    },
};

export default broadcastMessagePlugin;
