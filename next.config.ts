import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve Next.js's default HTML-only crawlers and include Telegram so
  // dynamically generated Open Graph metadata is present in the initial head.
  htmlLimitedBots: /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot/i,

  // Temporary config for development with ngrok
  allowedDevOrigins: ["evoke-mower-purist.ngrok-free.dev", "192.168.0.3"],
};

export default nextConfig;
