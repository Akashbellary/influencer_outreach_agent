// Minimal Node bridge using puppeteer-extra stealth to extract usernames from permalinks
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

async function getInstagramUsernameFromPost(page, permalinkUrl) {
  try {
    console.error(`[v0] Navigating to: ${permalinkUrl}`);
    await page.goto(permalinkUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.error(`[v0] Page loaded, waiting for profile picture...`);
    
    // Try multiple selectors for profile picture
    const selectors = [
      'div[role="dialog"] img[alt*="profile picture"]',
      'article img[alt*="profile picture"]',
      'img[alt*="profile picture"]',
      'a[href*="/"] img[alt*="profile picture"]'
    ];
    
    let imgHandle = null;
    for (const selector of selectors) {
      try {
        console.error(`[v0] Trying selector: ${selector}`);
        imgHandle = await page.waitForSelector(selector, { timeout: 5000 });
        if (imgHandle) {
          console.error(`[v0] Found element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.error(`[v0] Selector failed: ${selector} - ${e.message}`);
      }
    }
    
    if (imgHandle) {
      const altText = await imgHandle.evaluate((el) => el.alt);
      console.error(`[v0] Profile picture alt text: ${altText}`);
      const match = altText.match(/([\w.]+)'s profile picture/);
      if (match) {
        console.error(`[v0] Extracted username from alt text: ${match[1]}`);
        return match[1];
      }
    }
    
    console.error(`[v0] No profile picture found, checking page content...`);
    const pageContent = await page.content();
    console.error(`[v0] Page title: ${await page.title()}`);
    console.error(`[v0] Page URL: ${page.url()}`);
    
    // Check if we're on a login page or blocked
    if (pageContent.includes('login') || pageContent.includes('Login') || pageContent.includes('log in')) {
      console.error(`[v0] Detected login page - Instagram is blocking us`);
      return null;
    }
    
    // Try to find any username in the page
    const usernameMatch = pageContent.match(/@(\w+)/);
    if (usernameMatch) {
      console.error(`[v0] Found username in page content: ${usernameMatch[1]}`);
      return usernameMatch[1];
    }
    
  } catch (e) {
    console.error(`[v0] Error in getInstagramUsernameFromPost: ${e.message}`);
  }

  // Fallback: try to extract from URL
  const urlMatch = permalinkUrl.match(/instagram\.com\/([^\/]+)\//);
  if (urlMatch && !["p", "reel", "reels", "tv", "stories", "explore"].includes(urlMatch[1])) {
    console.error(`[v0] Extracted username from URL: ${urlMatch[1]}`);
    return urlMatch[1];
  }

  // Fallback: try to extract from page title
  try {
    const title = await page.title();
    console.error(`[v0] Page title: ${title}`);
    const titleMatch = title.match(/@([\w.]+)/);
    if (titleMatch) {
      console.error(`[v0] Extracted username from title: ${titleMatch[1]}`);
      return titleMatch[1];
    }
  } catch (e) {
    console.error(`[v0] Error getting page title: ${e.message}`);
  }

  console.error(`[v0] No username found for: ${permalinkUrl}`);
  return null;
}

async function main() {
  console.error("[v0] Node.js extractor starting...");
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  console.error(`[v0] Received input: ${input.substring(0, 100)}...`);
  let permalinks = [];
  try {
    const parsed = JSON.parse(input || "{}");
    permalinks = Array.isArray(parsed.permalinks) ? parsed.permalinks : [];
    console.error(`[v0] Parsed ${permalinks.length} permalinks`);
  } catch (e) {
    console.error(`[v0] Error parsing input: ${e.message}`);
  }

  console.error("[v0] Launching Puppeteer browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox", 
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu"
    ],
  });
  console.error("[v0] Browser launched successfully");
  
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  );
  await page.setViewport({ width: 1280, height: 800 });
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  console.error("[v0] Page configured, starting to process permalinks...");

  for (let i = 0; i < permalinks.length; i++) {
    const url = permalinks[i];
    console.error(`[v0] Processing permalink ${i + 1}/${permalinks.length}: ${url}`);
    const username = await getInstagramUsernameFromPost(page, url);
    console.error(`[v0] Extracted username: ${username || 'null'}`);
    process.stdout.write(JSON.stringify({ url, username }) + "\n");
    const delay = 2000 + Math.random() * 4000;
    await new Promise((r) => setTimeout(r, delay));
  }

  console.error("[v0] All permalinks processed, closing browser...");
  await browser.close();
  console.error("[v0] Node.js extractor completed");
}

main().catch(() => process.exit(1));


