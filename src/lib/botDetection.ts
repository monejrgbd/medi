const BOT_PATTERNS = [
  "facebookexternalhit",
  "whatsapp",
  "imessagelinkpreview",
  "slackbot",
  "twitterbot",
  "linkedinbot",
  "discordbot",
  "telegrambot",
  "skypeuripreview",
  "googlebot",
  "bingbot",
  "applebot",
];

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return BOT_PATTERNS.some((pattern) => lower.includes(pattern));
}
