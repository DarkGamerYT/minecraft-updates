// Integrations
import { Integration, BDS } from "./integration.ts";
import Discord from "./discord/index.ts";

const Integrations: Integration[] = [];
if (process.env.DISCORD_INTEGRATION !== undefined) {
    Integrations.push(new Discord);
}
if (process.env.MASTO_INTEGRATION !== undefined) {
    Integrations.push(new Mastodon);
}


// Event emitter stuff
import { ArticleData } from "../src/changelog.ts";
export function emitChangelog(
    isPreview: boolean, isHotfix: boolean,
    article: ArticleData
) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("changelog", integration,
            isPreview, isHotfix, article);
    };
};

export function emitBDS(bds: BDS) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("BDS", bds);
    };
};

import { Platform } from "../src/platforms/common.ts"
import Mastodon from "./mastodon/index.ts";
export function emitPlatformRelease(platform: Platform) {
    for (let i = 0; i < Integrations.length; i++) {
        const integration = Integrations[i];
        integration.emit("platformRelease", platform);
    };
};