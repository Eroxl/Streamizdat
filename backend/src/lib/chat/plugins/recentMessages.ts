import { ChatMiddlewareFn, ChatPlugin, ConnectMiddlewareFn } from "../chatApp";

const RECENT_MESSAGES_LIMIT = 50;
const recentMessages: {
    user: any;
    message: string;
}[] = [];

const sendRecentMessagesMiddleware: ConnectMiddlewareFn = (chatApp, client, next) => {
    chatApp.sendToUser({
        type: "recentMessages",
        data: recentMessages,
    }, client.ws);

    next();
}

const storeMessageMiddleware: ChatMiddlewareFn = async (message, _app, client, next) => {
    if (typeof message !== "string") return next();

    const userDisplay = client.state.userDisplay;
    recentMessages.push({
        user: userDisplay,
        message: message,
    });

    if (recentMessages.length > RECENT_MESSAGES_LIMIT) {
        recentMessages.shift();
    }

    next();
}

const recentMessagesPlugin: ChatPlugin = {
    middleware: {   
        connect: [sendRecentMessagesMiddleware],
        message: [storeMessageMiddleware],
    },
};

export default recentMessagesPlugin;