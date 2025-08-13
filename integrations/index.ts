// Integrations
import { Integration } from "./integration.ts";
import Discord from "./discord/index.ts";
import Mastodon from "./mastodon/index.ts";

const Integrations: Integration[] = [];
{
    if (process.env.DISCORD_INTEGRATION?.toLowerCase() === "true")
        Integrations.push(new Discord);

    if (process.env.MASTO_INTEGRATION?.toLowerCase() === "true")
        Integrations.push(new Mastodon);
};


// Event emitter stuff
export function emitChangelog(...data: any[]) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("changelog", integration, ...data);
    };
};

import { Platform } from "../src/platforms/common.ts"
export function emitPlatformRelease(platform: Platform) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("platformRelease", platform);
    };
};

export function emitAllPlatformsDone(...data: any[]) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("allPlatformsDone", ...data);
    };
};