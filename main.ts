import dotenv from "npm:dotenv";
dotenv.config();

import console from "node:console";
if (import.meta.main) {
    await main();
};

import Logger, { LogLevel } from "./src/util/logger.ts";
async function main() {
    let status: Deno.CommandStatus = {
        code: 1,
        signal: null,
        success: false,
    };

    while (status.code !== 0) {
        status = await runScript(Deno.args);
        Logger.log(LogLevel.Debug, "Process terminated. Status:", { ...status });

        if (!status.success) {
            console.log();
            await new Promise((resolve) => setTimeout(resolve, 5000));
        };
    };

    Logger.log(LogLevel.Debug, "Process completed successfully");
    Deno.exit(status.code);
};

async function runScript(runArgs: string[]): Promise<Deno.CommandStatus> {
    try {
        return await new Deno.Command("deno", {
            args: [ "run", ...runArgs ],
            stderr: "inherit",
            stdin: "inherit",
            stdout: "inherit",
        }).spawn().status;
    }
    catch (cause) {
        console.error(cause);
        return {
            code: 1,
            signal: null,
            success: false,
        };
    };
};