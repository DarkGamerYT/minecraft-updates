import { Integration } from "../integration.ts";
import { createRestAPIClient, mastodon } from "npm:masto"
import { newChangelog } from "./functionality.ts";

export default class Mastodon extends Integration {

    public client = createRestAPIClient({
            url: process.env.MASTO_URL!,
            accessToken: process.env.MASTO_TOKEN!
        })

    constructor() {
        super();

        this.start();
    }

    public async start() {
        this.on("changelog", newChangelog)
    }
    
}