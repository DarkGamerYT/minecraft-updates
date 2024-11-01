use dotenv::dotenv;
use serde::{Deserialize, Serialize};

use serenity::all::Timestamp;
use serenity::async_trait;
use serenity::prelude::*;
use serenity::model::{
    gateway::Ready,
    channel::ReactionType,
    id::GuildId,
    id::ChannelId,
    id::ForumTagId,
    id::EmojiId,
};
use serenity::builder::{
    CreateForumPost,

    CreateMessage,
    CreateActionRow,
    CreateButton,

    CreateEmbed,
    CreateEmbedAuthor,
    CreateEmbedFooter,
};

struct Handler;

#[derive(PartialEq)]
enum ArticleSection {
    BedrockPreview = 360001185332,
    BedrockRelease = 360001186971
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Article {
    pub id: i64,
    pub url: String,
    pub title: String,
    pub section_id: i64,
    pub created_at: String,
    pub updated_at: String,
    pub edited_at: String,
}

pub struct Post {
    pub version: String,
    pub thumbnail: Option<String>,
    pub article: Article,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Data {
    articles: Vec<Article>
}

impl Data {
    pub fn new<Func>(function: Func) -> Self
    where
        Func: FnOnce(Data) -> Data,
    {
        function(Self {
            articles: vec![],
        })
    }
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let token = std::env::var("token").expect("Expected a token in the environment");
    let intents = GatewayIntents::GUILDS | GatewayIntents::GUILD_MESSAGE_REACTIONS;

    let mut client =
        serenity::Client::builder(&token, intents).event_handler(Handler)
        .await.expect("Failed to create a client.");

    if let Err(why) = client.start().await {
        std::println!("Client error: {why:?}");
        std::process::exit(1);
    };

    // changelogs(client).await;
}

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, ctx: Context, ready: Ready) {
        std::println!("{} is connected!", ready.user.name);

        let post = Post {
            version: String::from("1.0.0"),
            thumbnail: Some(String::from("https://feedback.minecraft.net/hc/article_attachments/31137863479565")),
            article: Article {
                id: 1,
                url: String::from("https://google.com"),
                title: String::from("Minecraft - 1.0.0"),
                section_id: ArticleSection::BedrockPreview as i64,
                created_at: String::from("2000-01-01T00:00:00.000Z"),
                updated_at: String::from("2000-01-01T00:00:00.000Z"),
                edited_at: String::from("2000-01-01T00:00:00.000Z"),
            },
        };

        changelogs().await;
        //create_post(ctx, post, "Test", ArticleSection::BedrockRelease).await;
    }
}

async fn create_post(ctx: Context, post: Post, post_type: &str, section: ArticleSection) {
    let guild_id = GuildId::new(566684196396072980);
    let channel_id = ChannelId::new(1103665220544639048);

    let channels = guild_id.channels(&ctx.http).await.unwrap();
    let channel = channels.get(&channel_id).unwrap();

    std::println!("Channel name: {}", channel.name());

    let is_preview = section == ArticleSection::BedrockPreview;

    let result_t = post.article.updated_at.parse::<Timestamp>();
    if let Err(why) = result_t {
        std::println!("Couldn't parse timestamp: {why:?}");
        return;
    };

    let timestamp = result_t.unwrap();
    let embed = CreateEmbed::new()
        .author(CreateEmbedAuthor::new(if is_preview { "Beta and Preview Changelogs" } else { "Release Changelogs" })
            .url(if is_preview {
                "https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs"
            } else { "https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs" })
            .icon_url("https://cdn.discordapp.com/attachments/1071081145149689857/1071089941985112064/Mojang.png"))
        .thumbnail(if is_preview {
            "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067710226432/mcpreview.png"
        } else { "https://cdn.discordapp.com/attachments/1071081145149689857/1093331067425005578/mc.png" })
        .description(if is_preview {
            "It's that day of the week!\nA new Minecraft: Bedrock Edition Preview is out now!"
        } else { "A new stable release of Minecraft: Bedrock Edition is out now!" })
        .color(if is_preview { 0x46FF27 } else { 0x46FF27 })
        .image(&post.thumbnail.unwrap())
        .footer(CreateEmbedFooter::new("Posted on"))
        .timestamp(timestamp);

    let message_builder = CreateMessage::new()
        .embed(embed)
        .components(vec![
            CreateActionRow::Buttons(vec![
                CreateButton::new_link(post.article.url)
                    .label("Changelog")
                    .emoji(ReactionType::from(EmojiId::new(1090311574423609416))),
                CreateButton::new_link("https://feedback.minecraft.net/")
                    .label("Feedback")
                    .emoji(ReactionType::from(EmojiId::new(1090311572024463380))),
            ])
        ]);

    let thread_name = std::format!("{} - {}", post.version, post_type);
    let post_builder = CreateForumPost::new(thread_name, message_builder)
        .add_applied_tag(ForumTagId::new(1173285425503281192));

    let result = channel.create_forum_post(&ctx.http, post_builder).await;
    if let Err(why) = result {
        std::println!("Post create error: {why:?}");
        return;
    };

    let post = result.unwrap();
    let starter_message = post.message(&ctx.http, post.last_message_id.unwrap())
        .await.unwrap();

    let reaction = ReactionType::Unicode(String::from(if is_preview { "🍌" } else { "🍊" }));
    if let Err(_) = starter_message.react(&ctx.http, reaction).await {};
    if let Err(_) = starter_message.pin(&ctx.http).await {};
}

async fn changelogs() {
    let response = reqwest::get("https://feedback.minecraft.net/api/v2/help_center/en-us/articles.json").await.unwrap();
    match response.status().is_success() {
        true => {
            let data = response.json::<Data>().await;
            if let Err(why) = data {
                std::println!("Failed to parse data to JSON. {why:?}");
                return;
            };

            let json = data.unwrap();
            
            let mut preview = "";
            let mut stable = "";
            for i in 0..json.articles.len() {
                let article = &json.articles[i];
                
                if article.section_id == ArticleSection::BedrockPreview as i64 {
                    if !preview.is_empty() {
                        continue;
                    };

                    preview = &article.title;
                }
                else if article.section_id == ArticleSection::BedrockRelease as i64 {
                    if !stable.is_empty() {
                        continue;
                    };

                    stable = &article.title;
                };
            };

            std::println!("Preview: {}", preview);
            std::println!("Stable: {}", stable);
            // std::println!("{}", response.text().await.unwrap());
        },
        false => {},
    };
}