"use client";

import { useEffect } from "react";

/**
 * Redirects the visitor to the target URL on the client.
 *
 * This is intentionally NOT a server-side `redirect()`. If we redirected
 * on the server, the response would just be a 30x with no body, and social
 * crawlers (facebookexternalhit, WhatsApp, Twitterbot, LinkedInBot,
 * TelegramBot, Discordbot, Slackbot, ...) would never see the HTML that
 * `generateMetadata()` produced - they'd just follow the redirect straight
 * to the target page and miss the custom OG image/title/description.
 *
 * Crawlers don't execute JavaScript, so they stop at this fully-rendered
 * HTML and read the <head> metadata. Real visitors have JS, so this effect
 * fires immediately and sends them on to the target URL.
 */
export default function AutoRedirect({ targetUrl }: { targetUrl: string }) {
  useEffect(() => {
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return null;
}
