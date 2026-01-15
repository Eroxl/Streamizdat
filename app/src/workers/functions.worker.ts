import * as Comlink from "comlink";
import { createHash } from "crypto";

async function solveHashCash(challenge: string, difficulty: number): Promise<string> {
    let nonce = 0;
    const prefix = "0".repeat(difficulty);

    while (true) {
        const hashHex = createHash("sha1").update(`${challenge}${nonce}`).digest("hex");

        if (hashHex.startsWith(prefix)) {
            return nonce.toString();
        }
        nonce++;
    }
}

export type WorkerApi = {
    solveHashCash: typeof solveHashCash;
};

Comlink.expose({
    solveHashCash,
});