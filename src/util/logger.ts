import console from "node:console";

export enum LogLevel {
    Info = 0,
    Warn,
    Debug,
    Error
};

export default class Logger {
    private static getType(level: LogLevel): string {
        switch (level) {
            case LogLevel.Warn:
                return "WARN";

            case LogLevel.Error:
                return "ERROR";
        };

        return (level == LogLevel.Debug ? "DEBUG" : "INFO");
    };

    private static getColor(level: LogLevel) {
        switch (level) {
            case LogLevel.Warn:
                return "\x1B[33m";

            case LogLevel.Error:
                return "\x1B[31m";
        };

        return "\x1B[36m";
    };

    private static formatTime(epoch: number = Date.now()) {
        const date = new Date(epoch);
        const time = date.toLocaleTimeString();

        const [ month, day, year ] = date.toLocaleDateString().split("/");
        return `${year}-${month}-${day} ${time}`;
    };

    public static log(level: LogLevel, ...data: any[]) {
        const message =
            "\x1B[0m[".concat(Logger.formatTime(), "] ")
            .concat(Logger.getColor(level))
            .concat("\x1B[1m[", Logger.getType(level), "] \x1B[0m-");

        console.log(message, ...data);
    };
};