export abstract class Platform {
    public abstract name: string;
    public download: string = "https://www.minecraft.net/en-us/about-minecraft";
    public fetchPreview: boolean = false;
    public latestVersion: string = "0.0.0";

    constructor(fetchPreview: boolean = false) {
        this.fetchPreview = fetchPreview;
    };

    public abstract fetchLatestVersion(): Promise<string>;
};