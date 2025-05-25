import htmlParser from "npm:node-html-parser";
import Changelog from "../changelog.ts";

import { Platform } from "./common.ts";
export default class Windows extends Platform {
    public name: string = "Microsoft Store";

    public async fetchLatestVersion(): Promise<string> {
        try {
            const response = await fetch(
                "https://store.rg-adguard.net/api/GetFiles", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: (
                        "type=PackageFamilyName&url=Microsoft."
                        + (this.fetchPreview ? "MinecraftWindowsBeta" : "MinecraftUWP" )
                        + "_8wekyb3d8bbwe&ring=RP&lang=en-US"
                    ),
                },
            );
            const text = await response.text();
            if (text.includes("The server returned an empty list."))
                return this.latestVersion;

            const parsed = htmlParser.parse(text);
            const body = (
                parsed.getElementsByTagName("a")
                .filter((element) => (
                    element.innerText.includes(
                        this.fetchPreview ? "MinecraftWindowsBeta" : "MinecraftUWP"
                    )
                    && element.innerText.includes(".appx")
                ))
            )[0];

            const version = Changelog.extractVersion(body.innerText);
            if (true === this.fetchPreview) {
                this.download = "https://www.microsoft.com/store/productId/9P5X4QVLC2XR";

                let [ major, minor, patch, revision ] = version;

                let string = patch.toString();
                revision = Number(string.slice(2, 4));
                patch = Number(string.slice(0, 2));

                this.latestVersion = [ major, minor, patch, revision ].filter(Boolean).join(".");
            }
            else {
                this.download = "https://www.microsoft.com/store/productId/9NBLGGH2JHXJ";

                let [ major, minor, patch ] = version;
                patch = Number(patch.toString().slice(0, 2));

                this.latestVersion = [ major, minor, patch ].filter(Boolean).join(".");
            };
        }
        catch {};
        return this.latestVersion;
    };
};