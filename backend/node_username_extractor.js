// Minimal Node bridge using puppeteer-extra stealth to extract usernames from permalinks
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Enhanced browser launch options for Render deployment
const getBrowserOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    timeout: isProduction ? 60000 : 30000,
    protocolTimeout: isProduction ? 60000 : 30000,
    ...(isProduction && {
      executablePath: '/usr/bin/chromium-browser'
    })
  };
};

async function getInstagramUsernameFromPost(page, permalinkUrl, retryCount = 0) {
  const maxRetries = 2;
  
  try {
    console.error(`[v0] Navigating to: ${permalinkUrl} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Add random delay to avoid rate limiting
    if (retryCount > 0) {
      const delay = Math.random() * 2000 + 1000; // 1-3 seconds
      console.error(`[v0] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await page.goto(permalinkUrl, { 
      waitUntil: "domcontentloaded", 
      timeout: 30000 
    });
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
    
    // Retry logic for network errors or timeouts
    if (retryCount < maxRetries && (
      e.message.includes('timeout') || 
      e.message.includes('net::') || 
      e.message.includes('ERR_') ||
      e.message.includes('Navigation timeout')
    )) {
      console.error(`[v0] Retrying due to network error (attempt ${retryCount + 1}/${maxRetries})`);
      return await getInstagramUsernameFromPost(page, permalinkUrl, retryCount + 1);
    }
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
  
  // Set a global timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.error("[v0] Process timeout reached, exiting...");
    process.exit(1);
  }, 300000); // 5 minutes timeout
  
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
  const browserOptions = getBrowserOptions();
  console.error(`[v0] Browser options: ${JSON.stringify(browserOptions, null, 2)}`);
  
  let browser;
  try {
    browser = await puppeteer.launch(browserOptions);
    console.error("[v0] Browser launched successfully");
  } catch (error) {
    console.error(`[v0] Browser launch failed: ${error.message}`);
    console.error(`[v0] Browser launch error details: ${error.stack}`);
    process.exit(1);
  }
  
  let page;
  try {
    console.error("[v0] Creating new page...");
    page = await browser.newPage();
    console.error("[v0] Page created successfully");
    
    console.error("[v0] Setting user agent...");
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    );
    console.error("[v0] User agent set successfully");
    
    console.error("[v0] Setting viewport...");
    await page.setViewport({ width: 1280, height: 800 });
    console.error("[v0] Viewport set successfully");
    
    console.error("[v0] Setting HTTP headers...");
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    console.error("[v0] HTTP headers set successfully");
    
    console.error("[v0] Page configured, starting to process permalinks...");
  } catch (error) {
    console.error(`[v0] Page setup failed: ${error.message}`);
    console.error(`[v0] Page setup error details: ${error.stack}`);
    await browser.close();
    process.exit(1);
  }

  for (let i = 0; i < permalinks.length; i++) {
    const url = permalinks[i];
    console.error(`[v0] Processing permalink ${i + 1}/${permalinks.length}: ${url}`);
    
    try {
      const username = await getInstagramUsernameFromPost(page, url);
      console.error(`[v0] Extracted username: ${username || 'null'}`);
      process.stdout.write(JSON.stringify({ url, username }) + "\n");
    } catch (error) {
      console.error(`[v0] Error processing permalink ${url}: ${error.message}`);
      console.error(`[v0] Error details: ${error.stack}`);
      process.stdout.write(JSON.stringify({ url, username: null }) + "\n");
    }
    
    const delay = 2000 + Math.random() * 4000;
    console.error(`[v0] Waiting ${delay}ms before next permalink...`);
    await new Promise((r) => setTimeout(r, delay));
  }

  console.error("[v0] All permalinks processed, closing browser...");
  await browser.close();
  console.error("[v0] Node.js extractor completed");
  
  // Clear the timeout since we completed successfully
  clearTimeout(timeout);
}

main().catch((error) => {
  console.error(`[v0] Main function error: ${error.message}`);
  console.error(`[v0] Main function error details: ${error.stack}`);
  process.exit(1);
});


