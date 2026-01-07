import StatusCache from "../types/StatusCache";
import { WATCHERS } from "../watchers";

const handleServerEvent = (message: string, previousStatuses: StatusCache) => {
    const event = JSON.parse(message) as { type: string; timestamp: number; };

    if (event.type !== "server_restart") return;

    Object.values(WATCHERS).forEach(async (watcher) => {
        Object.keys(previousStatuses).forEach(channelId => {
            delete previousStatuses[channelId];
        });

        await watcher.refreshAllStatuses();
    });
}

export default handleServerEvent;
