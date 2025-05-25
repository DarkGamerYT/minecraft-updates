import fs from "node:fs";
const isDev = process.argv.includes("--dev");

import { ArticleData } from "../../src/changelog.ts";
import { Platform } from "../../src/platforms/common.ts";
import { BDS } from "../integration.ts";
import Discord from "./index.ts";
import Logger, { LogLevel } from "../../src/util/logger.ts";

const config = JSON.parse(
    fs.readFileSync(
        isDev ? "integrations/discord/data/config-test.json"
        : "integrations/discord/data/config.json"
    ).toString()
);

import {
    ChannelType,
    ForumThreadChannel,
    Message,
    MessageFlags,

    ActionRowBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorSpacingSize,
    ButtonBuilder,
    ButtonStyle,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} from "npm:discord.js";
async function postChangelog(
    discord: Discord,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const channel = discord.client.channels.cache.get(config.channel);
    if (channel == void 0 || channel.type !== ChannelType.GuildForum)
        return;

    const emoji = isPreview ? "🍌" : (isHotfix ? "🌶" : "🍏");
    const type = isPreview ? "Preview" : (isHotfix ? "Hotfix" : "Stable");

    const threads = channel.threads;

    const container = new ContainerBuilder();
    container.setAccentColor(
        isPreview ? 0xFFCC00
        : (isHotfix ? 0xDA2F47 : 0x46FF27),
    );
        
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(`## ${emoji} ${data.article.title}`)
    );
    
    const description = new TextDisplayBuilder().setContent(
        (isPreview
            ? [
                "It's that day of the week!",
                "A new Preview release for Minecraft: Bedrock Edition is out now!"
            ]
            : [
                isHotfix
                ? "A new spicy stable release for Minecraft: Bedrock Edition is out now!"
                : "A new stable release for Minecraft: Bedrock Edition is out now!"
            ]
        ).join("\n"),
    );
    
    container.addTextDisplayComponents(description);
    
    if (typeof data.thumbnail === "string") {
        const media = new MediaGalleryBuilder();
        media.addItems(
            new MediaGalleryItemBuilder()
            .setDescription(data.article.title)
            .setURL(data.thumbnail),
        );
        container.addMediaGalleryComponents(media);
    };
    
    container.addSeparatorComponents((separator) =>
        separator.setSpacing(SeparatorSpacingSize.Small));
        
    const date = Math.floor(
        new Date(data.article.updated_at).getTime() / 1000
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(`-# Posted <t:${date}:R> — <t:${date}:F>`),
    );
    
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents([
        new ButtonBuilder()
            .setLabel("Link")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311574423609416", name: "changelog" })
            .setURL(data.article.url),
        new ButtonBuilder()
            .setLabel("Feedback")
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311572024463380", name: "feedback" })
            .setURL("https://feedback.minecraft.net/"),
    ]);

    const post = await threads.create({
        name: `${emoji} ${type} ${data.version}`,
        appliedTags: [
            isPreview ? config.tags.preview : config.tags.stable
        ],
        message: {
            flags: MessageFlags.IsComponentsV2,
            components: [ container, row ],
        },
    });

    const message = await post.fetchStarterMessage();
    if (message == void 0)
        return post;

    try {
        await message.react(emoji);
        await message.pin();
    }
    catch {};

    return post;
};

async function platformRelease(post: ForumThreadChannel, platform: Platform) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(
            `**${platform.fetchPreview ? "Minecraft Preview" : "Minecraft"} v${platform.latestVersion}**`
            + ` is out now on the ${platform.name}!`
        ),
    );
                        
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents([
        new ButtonBuilder()
            .setLabel("Open ".concat(platform.name))
            .setStyle(ButtonStyle.Link)
            .setEmoji({ id: "1090311572024463380", name: "feedback" })
            .setURL(platform.download),
    ]);
    
    try {
        const message = await post.send({
            flags: MessageFlags.IsComponentsV2,
            components: [ container, row ],
        });

        if (platform.name === "Microsoft Store") {
            pingMembers(message);
        };
    }
    catch(error) {
        console.error(error);
    };
};

async function bdsRelease(post: ForumThreadChannel, bds: BDS) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
        new TextDisplayBuilder()
        .setContent(
            "Bedrock Dedicated Server for "
            + `**${bds.isPreview ? "Minecraft Preview" : "Minecraft"} v${bds.version}**`
            + " is out now!"
        ),
    );
    
    const row = new ActionRowBuilder<ButtonBuilder>();
    row.addComponents([
        new ButtonBuilder()
        .setLabel("Download Bedrock Dedicated Server")
        .setStyle(ButtonStyle.Link)
        .setEmoji({ id: "1090311574423609416", name: "changelog" })
        .setURL("https://www.minecraft.net/en-us/download/server/bedrock"),
    ]);
    
    try {
        await post.send({
            flags: MessageFlags.IsComponentsV2,
            components: [ container, row ],
        });
    }
    catch(error) {
        console.error(error);
    };
};

export async function newChangelog(
    discord: Discord,
    isPreview: boolean, isHotfix: boolean,
    data: ArticleData
) {
    const channel = postChangelog(discord, isPreview, isHotfix, data);

    // Platform Release
    const platformListener = async (platform: Platform) => {
        const post = await channel;
        if (post == void 0) {
            discord.off("platformRelease", platformListener);
            return;
        };

        if (isPreview !== platform.fetchPreview
            || data.version !== platform.latestVersion)
            return;

        platformRelease(post, platform);
        discord.off("platformRelease", platformListener);
    };
    discord.on("platformRelease", platformListener);
                    
    // BDS Release
    const bdsListener = async (bds: BDS) => {
        const post = await channel;
        if (post == void 0) {
            discord.off("platformRelease", platformListener);
            return;
        };

        if (isPreview !== bds.isPreview
            || data.version !== bds.version)
            return;

        bdsRelease(post, bds);
        discord.off("BDS", bdsListener);
    };
    discord.on("BDS", bdsListener);

    const post = await channel;
    if (post == void 0)
        return;

    const message = await post.fetchStarterMessage();
    if (message == void 0)
        return post;

    pingMembers(message);
};

async function pingMembers(message: Message) {
    const pings: string[] = JSON.parse(
        fs.readFileSync("integrations/discord/data/pings.json").toString()
    );

    if (!Array.isArray(pings) || pings.length === 0)
        return;

    try {
        const ping = await message.reply({
            content: pings
                .map((id) => `<@${id}>`)
                .join(" ")
        });

        if (await ping.fetch(true) != void 0)
            await ping.delete();
    }
    catch {};
};