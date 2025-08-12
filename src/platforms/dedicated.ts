const isWindows = process.platform === "win32";
import Changelog from "../changelog.ts"

import { Platform } from "./common.ts";
export default class Dedicated extends Platform {
    public name: string = "Dedicated";
    public override download: string = "https://www.minecraft.net/en-us/download/server/bedrock";

    public async fetchLatestVersion(): Promise<string> {
        try {
            const response = await fetch("https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json");
            const data = await response.json();

            const latest = data[isWindows ? "windows" : "linux"][this.fetchPreview ? "preview" : "stable"];
            const version = Changelog.extractVersion(latest);
            if (true === this.fetchPreview) {
                const [ major, minor, patch, revision ] = version;
                this.latestVersion = [ major, minor, patch, revision ].filter(Boolean).join(".");
            }
            else {
                const [ major, minor, patch ] = version;
                this.latestVersion = [ major, minor, patch ].filter(Boolean).join(".");
            };
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};