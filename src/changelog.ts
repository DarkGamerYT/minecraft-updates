import fs from "node:fs";
import path from "node:path";

import htmlParser from "npm:node-html-parser";

export interface ArticleData {
    version: string;
    thumbnail: string | null;
    article: {
        id: number;
        url: string;
        title: string;
        created_at: string;
        updated_at: string;
        edited_at: string;
    };
};

export default class Changelog {
    public static extractVersion(version: string): number[] {
        const regex = /(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/;
        try {
            const result = regex.exec(version);
            if (result != void 0) {
                const [ _, major, minor, patch, revision ] = result.map(Number);
                return [ major, minor, patch || 0, revision ];
            };
        }
        catch {};
        return [ 0, 0, 0 ];
    };

    public static async fetchLatestChangelog(
        callback: (isPreivew: boolean, data: ArticleData) => void
    ) {
        const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json");
        const { articles }: { articles: any[] } = await response.json();

        // Find latest Preview article
        const preview = articles.find((article: any) =>
            article.section_id == 360001185332);
        
        callback(true, formatArticle(preview));

        // Find latest Stable/Hotfix article
        const stable = articles.find((article: any) =>
            article.section_id == 360001186971
            && (article.title.includes("MCPE") || article.title.includes("Bedrock")));
            
        callback(false, formatArticle(stable));
    };

    public static getLatestSavedVersion(isPreview: boolean): string {
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
        };

        const article = path.join("data",
            (isPreview ? "preview-articles" : "stable-articles").concat(".json"));
        
        if (!fs.existsSync(article)) {
            return "0.0.0";
        };

        const data: ArticleData[] = JSON.parse(
            fs.readFileSync(article).toString()
        );

        return data.sort(
            ({ article: a }, { article: b }) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0].version;
    };

    public static saveArticle(isPreview: boolean, data: ArticleData) {
        if (!fs.existsSync("data")) {
            fs.mkdirSync("data");
        };

        const article = path.join("data",
            (isPreview ? "preview-articles" : "stable-articles").concat(".json"));

        const articles: ArticleData[] = JSON.parse(
            fs.readFileSync(article).toString()
        );

        articles.reverse();
        articles.push(data);
        articles.reverse();

        fs.writeFileSync(article, JSON.stringify(articles, null, 4));
    };
};

export function formatArticle(article: any): ArticleData {
    const parsed = htmlParser.parse(article.body);
    const imageSrc = parsed.getElementsByTagName("img")[0]?.getAttribute("src");

    return {
        version: Changelog
            .extractVersion(article.name)
            ?.filter((i) => !Number.isNaN(i))
            ?.join("."),
        thumbnail: (
            imageSrc?.startsWith("https://feedback.minecraft.net/hc/article_attachments/")
            ? imageSrc : null
        ),
        article: {
            id: article.id,
            url: "https://feedback.minecraft.net/hc/en-us/articles/".concat(article.id),
            title: article.title,
            created_at: article.created_at,
            updated_at: article.updated_at,
            edited_at: article.edited_at,
        },
    };
};