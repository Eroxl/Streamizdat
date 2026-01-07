import kickWatcher from "./kickWatcher";
import twitchWatcher from "./twitchWatcher";
import youtubeWatcher from "./youtubeWatcher";

const WATCHERS = {
    youtube: youtubeWatcher,
    twitch: twitchWatcher,
    kick: kickWatcher,
};

export { WATCHERS };
