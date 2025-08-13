const isWindows = process.platform === "win32";
import { Platform } from "./common.ts";
import Version from "../util/version.ts";
export default class Dedicated extends Platform {
    public static platform: string = "Dedicated";
    
    public name: string = Dedicated.platform;
    public override download: string = "https://www.minecraft.net/en-us/download/server/bedrock";

    public async fetchLatestVersion(): Promise<Version> {
        try {
            const response = await fetch("https://raw.githubusercontent.com/Bedrock-OSS/BDS-Versions/main/versions.json");
            const data = await response.json();

            const latest = data[isWindows ? "windows" : "linux"][this.fetchPreview ? "preview" : "stable"];
            this.latestVersion = Version.fromString(latest);
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};