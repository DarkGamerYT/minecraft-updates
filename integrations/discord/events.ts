import fs from "node:fs";
import path from "node:path";
import { Client } from "npm:discord.js";
export default async function(client: Client) {
    const eventsPath = path.join(import.meta.dirname ?? "", "/events/");
    const eventFiles = fs.readdirSync(eventsPath)
        .filter((file) => file.endsWith(".ts"));

    for (let i = 0; i < eventFiles.length; i++) {
        const eventFile = eventFiles[i];
        const event = (await import(
            "./events/".concat(eventFile)
        )).default;

        client[event?.once ? "once" : "on"](event.name,
            (...args) => event.execute(client, ...args),
        );
    };
};