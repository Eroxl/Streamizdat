import { createHash } from "node:crypto";
import { ChatPlugin, ConnectMiddlewareFn, ChatMiddlewareFn, ChatApp, ChatClient } from "../chatApp";

const DIFFICULTY_LEVEL = 5;

const generateHashCashChallenge = () => {
    return Math.random().toString(36).substring(2, 15);
}

const verifyHashCashSolution = (challenge: string, solution: string, difficulty: number): boolean => {
    const hash = createHash("sha1").update(`${challenge}${solution}`).digest("hex");

    const leadingZeros = hash.match(/^0+/);
    const zeroCount = leadingZeros ? leadingZeros[0].length : 0;

    console.log(`HashCash verification: challenge=${challenge}, solution=${solution}, hash=${hash}, leadingZeros=${zeroCount}`);

    return zeroCount >= difficulty;
}

const sendNewChallenge = (chatApp: ChatApp, client: ChatClient, difficulty: number) => {
    const newChallenge = generateHashCashChallenge();
    client.state["hashCashChallenge"] = newChallenge;

    chatApp.sendToUser(
        {
            type: "hashCashChallenge",
            data: {
                challenge: newChallenge,
                difficulty: difficulty,
            }
        },
        client.ws
    );
}

const initialHashCashMiddleware: ConnectMiddlewareFn = async (chatApp, client, next) => {
    sendNewChallenge(chatApp, client, DIFFICULTY_LEVEL);

    next();
}

const hashCashGuardMiddleware: ChatMiddlewareFn = (message, chatApp, client, next) => {
    if (typeof message === "object" || client.state["isAdmin"] === true) {
        return next();
    }

    const status = client.state["hashCashVerified"] as boolean | undefined;

    if (status === true) {
        client.state["hashCashVerified"] = false;
        sendNewChallenge(chatApp, client, DIFFICULTY_LEVEL);
        return next();
    }

    chatApp.sendToUser(
        {
            type: "error",
            data: {
                message: "Too many messages sent without valid HashCash solution.",
            },
        },
        client.ws
    );
}

const hashCashVerificationMiddleware: ChatMiddlewareFn = (message, chatApp, client, next) => {
    if (typeof message !== "object" || message.type !== "hashCashSolution") {
        return next();
    }

    const { solution } = message.data;
    const challenge = client.state["hashCashChallenge"] as string | undefined;

    if (!challenge || !verifyHashCashSolution(challenge, solution, DIFFICULTY_LEVEL)) {
        chatApp.sendToUser(
            {
                type: "hashCashResult",
                data: { success: false },
            },
            client.ws
        ); 

        return next();
    };

    client.state["hashCashVerified"] = true;

    next();
}

const hashCashPlugin: ChatPlugin = {
    middleware: {
        connect: [initialHashCashMiddleware],
        message: [hashCashVerificationMiddleware, hashCashGuardMiddleware],
    },
};

export default hashCashPlugin;
