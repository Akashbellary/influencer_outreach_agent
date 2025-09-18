// Minimal Node bridge using puppeteer-extra stealth to extract usernames from permalinks
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function getInstagramUsernameFromPost(page, permalinkUrl) {
  try {
    await page.goto(permalinkUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const imgHandle = await page.waitForSelector('div[role="dialog"] img[alt*="profile picture"]', { timeout: 10000 });
    const altText = await imgHandle.evaluate((el) => el.alt);
    const match = altText.match(/([\w.]+)'s profile picture/);
    if (match) return match[1];
  } catch {}

  const urlMatch = permalinkUrl.match(/instagram\.com\/([^\/]+)\//);
  if (urlMatch && !["p", "reel", "reels", "tv", "stories", "explore"].includes(urlMatch[1])) {
    return urlMatch[1];
  }

  try {
    const title = await page.title();
    const titleMatch = title.match(/@([\w.]+)/);
    if (titleMatch) return titleMatch[1];
  } catch {}

  return null;
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let permalinks = [];
  try {
    const parsed = JSON.parse(input || "{}");
    permalinks = Array.isArray(parsed.permalinks) ? parsed.permalinks : [];
  } catch {}

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  );
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

  for (const url of permalinks) {
    const username = await getInstagramUsernameFromPost(page, url);
    process.stdout.write(JSON.stringify({ url, username }) + "\n");
    const delay = 2000 + Math.random() * 4000;
    await new Promise((r) => setTimeout(r, delay));
  }

  await browser.close();
}

main().catch(() => process.exit(1));


