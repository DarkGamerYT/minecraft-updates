import fs from "node:fs";

if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
};

import { ArticleData, formatArticle } from "./changelog.ts";
(async () => {
    const stableArticles: ArticleData[] = [];
    const previewArticles: ArticleData[] = [];

    const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100");
    const data = await response.json();

    for (let i = 1; i <= data.page_count; i++) {
        const response = await fetch("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json?per_page=100&page=".concat(i.toString()));
        const { articles }: { articles: any[] } = await response.json();

        const stable = articles.filter((article: any) =>
            article.section_id == 360001186971
            && (article.title.includes("MCPE") || article.title.includes("Bedrock")));

        stableArticles.push(...stable.map(formatArticle));

        const preview = articles.filter((article: any) =>
            article.section_id == 360001185332);
        previewArticles.push(...preview.map(formatArticle));
    };

    // Save the articles
    fs.writeFileSync("data/stable-articles.json",
        JSON.stringify(stableArticles, null, 4 ));

	fs.writeFileSync("data/preview-articles.json",
        JSON.stringify(previewArticles, null, 4 ));
})();