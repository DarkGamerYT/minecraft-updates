import fs from "node:fs";

import Logger, { LogLevel } from "./util/logger.ts";
Logger.log(LogLevel.Info, "Starting...");

const { version } = JSON.parse(fs.readFileSync("package.json").toString());
Logger.log(LogLevel.Debug, "Version:", version);

// Integrations
import { emitChangelog, emitPlatformRelease, emitBDS } from "../integrations/index.ts";
import Changelog, { ArticleData } from "./changelog.ts";


// Platforms
import { Platform } from "./platforms/common.ts";
import Dedicated from "./platforms/dedicated.ts";
import Windows from "./platforms/windows.ts";
import iOS from "./platforms/ios.ts";

export const Platforms: Platform[] = [];
Platforms.push(new Dedicated, new Dedicated(true));
Platforms.push(new Windows, new Windows(true));
Platforms.push(new iOS);

// Platform loop
async function platformLoop(isPreview: boolean, data: ArticleData) {
    for (const platform of Platforms) {
        if (isPreview !== platform.fetchPreview
            || data.version === platform.latestVersion)
            continue;

        await platform.fetchLatestVersion();
        if (data.version !== platform.latestVersion)
            continue;

        if (platform.name === "Dedicated") {
            emitBDS({ isPreview, version: data.version });
        }
        else {
            emitPlatformRelease(platform);
        };
    };

    //const allDone = Platforms.every((platform) =>
    //    platform.latestVersion === data.version
    //    && platform.fetchPreview === isPreview);

    //if (true === allDone)
    //    return;

    await new Promise((resolve) => setTimeout(resolve, 15000)); // Sleep for 15 seconds
    platformLoop(isPreview, data);
};


// Changelog loop
function loop() {
    Changelog.fetchLatestChangelog((isPreview, data) => {
        if (true === isPreview) {
            const preview = Changelog.getLatestSavedVersion(true);
            if (preview === data.version)
                return;

            Logger.log(LogLevel.Info, data.article.title);

            emitChangelog(isPreview, false, data);
        }
        else {
            const stable = Changelog.getLatestSavedVersion(false);
            if (stable === data.version)
                return;

            Logger.log(LogLevel.Info, data.article.title);

            const patch = Changelog.extractVersion(data.version)[2];
            const isHotfix = patch > Math.floor(patch / 10) * 10;

            emitChangelog(isPreview, isHotfix, data);
        };

        platformLoop(isPreview, data);
        Changelog.saveArticle(isPreview, data);
    }).catch(() => {});
};

setTimeout(loop, 7500);
setInterval(loop, 60000);