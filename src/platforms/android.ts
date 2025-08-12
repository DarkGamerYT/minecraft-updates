import gplay from "npm:google-play-scraper";
import Changelog from "../changelog.ts";

import { Platform } from "./common.ts";
export default class Android extends Platform {
    public name: string = "Google Play Store";
    public override download: string = "https://play.google.com/store/apps/details?id=com.mojang.minecraftpe";

    public async fetchLatestVersion(): Promise<string> {
        try {
            const data = await gplay.app({
                appId: "com.mojang.minecraftpe",
                lang: "en",
                country: "us",
            });

            const version = Changelog.extractVersion(data.version);
            let [ major, minor, patch, revision ] = version;
            if (true === this.fetchPreview) {
                this.latestVersion = [ major, minor, patch, revision ].filter(Boolean).join(".");
            }
            else {
                this.latestVersion = [ major, minor, patch ].filter(Boolean).join(".");
            };
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};