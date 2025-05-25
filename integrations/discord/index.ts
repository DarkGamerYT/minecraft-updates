import process from "node:process";
import { Client, GatewayIntentBits } from "npm:discord.js";
const isDev = process.argv.includes("--dev");

import { Integration } from "../integration.ts";
import { newChangelog } from "./functionality.ts";
import registerEvents from "./events.ts";
export default class Discord extends Integration {
    public client: Client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessageReactions,
        ],
    });

    constructor() {
        super();

        registerEvents(this.client);
        this.start();

        this.on("changelog", newChangelog);
    };

    public async start() {
        try {
            await this.client.login(
                isDev ? process.env["TOKEN-TEST"] : process.env.TOKEN
            );
        }
        catch {
            this.start();
        };
    };
};