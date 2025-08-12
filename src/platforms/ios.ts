import { Platform } from "./common.ts";
export default class iOS extends Platform {
    public name: string = "iOS App Store";
    public override download: string = "https://apps.apple.com/app/apple-store/id479516143";

    public async fetchLatestVersion(): Promise<string> {
        try {
            const response = await fetch("https://itunes.apple.com/lookup?id=479516143");
            const { results: [ data ] } = await response.json();

            this.latestVersion = data["version"];
        }
        catch(e) {
            console.error(this.name.concat(":"), e);
        };
        
        return this.latestVersion;
    };
};