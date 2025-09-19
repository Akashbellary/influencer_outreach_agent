// Enhanced Instagram Username Extractor with Maximum Stealth for Render (2025)
// WARNING: Success rate will still be low due to Instagram's advanced anti-bot measures

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Configure stealth plugin with maximum evasions
puppeteer.use(StealthPlugin({
  enabledEvasions: new Set([
    'chrome.app',
    'chrome.csi',
    'chrome.loadTimes',
    'chrome.runtime',
    'defaultArgs',
    'iframe.contentWindow',
    'media.codecs',
    'navigator.hardwareConcurrency',
    'navigator.languages',
    'navigator.permissions',
    'navigator.plugins',
    'navigator.webdriver',
    'sourceurl',
    'user-agent-override',
    'webgl.vendor',
    'window.outerdimensions'
  ])
}));

// Enhanced browser launch options for maximum stealth on Render
const getBrowserOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Extended Chrome executable paths for Render
  let executablePath = undefined;
  if (isProduction) {
    const possiblePaths = [
      process.env.CHROMIUM_PATH,
      process.env.GOOGLE_CHROME_SHIM,
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome-beta',
      '/snap/chromium/current/usr/lib/chromium-browser/chrome'
    ];

    for (const path of possiblePaths) {
      if (require('fs').existsSync(path)) {
        executablePath = path;
        console.error(`[v0] Using Chrome at: ${path}`);
        break;
      }
    }
  }

  const options = {
    headless: true, // Keep true for Render
    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true,
    args: [
      // Core security args for Render
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',

      // Enhanced stealth args
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images', // Saves bandwidth on Render

      // Performance optimizations for Render
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--memory-pressure-off',
      '--max_old_space_size=4096',

      // Additional stealth measures
      '--disable-component-extensions-with-background-pages',
      '--disable-notifications',
      '--disable-permissions-api',
      '--disable-client-side-phishing-detection',
      '--disable-chrome-whats-new-ui',
      '--disable-chrome-welcome-ui',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-pings',
      '--no-crash-upload',

      // Viewport and display
      '--window-size=1920,1080',
      '--start-maximized',

      // User agent (will be overridden in page setup)
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    timeout: isProduction ? 120000 : 60000,
    protocolTimeout: isProduction ? 120000 : 60000
  };

  if (executablePath) {
    options.executablePath = executablePath;
  }

  return options;
};

// Enhanced username extraction with multiple fallback strategies
async function getInstagramUsernameFromPost(page, permalinkUrl, retryCount = 0) {
  const maxRetries = 3;

  try {
    console.error(`[v0] Processing: ${permalinkUrl} (attempt ${retryCount + 1})`);

    // Progressive delay for retries
    if (retryCount > 0) {
      const delay = (retryCount * 3000) + (Math.random() * 2000); // 3-5s, 6-8s, 9-11s
      console.error(`[v0] Retry delay: ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Pre-navigation setup
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver traces
      delete navigator.__proto__.webdriver;

      // Override navigator properties
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Mock chrome object
      window.chrome = {
        runtime: {}
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Navigate with enhanced wait conditions
    const response = await page.goto(permalinkUrl, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 45000
    });

    console.error(`[v0] Response status: ${response?.status()}`);
    console.error(`[v0] Final URL: ${page.url()}`);

    // Wait for page to fully render
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for redirect to login
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('accounts/login')) {
      console.error(`[v0] Redirected to login - ${currentUrl}`);

      // Try alternative extraction methods
      const urlUsername = extractUsernameFromUrl(permalinkUrl);
      if (urlUsername) {
        console.error(`[v0] Extracted from URL: ${urlUsername}`);
        return urlUsername;
      }

      return null;
    }

    // Enhanced selector strategies with better error handling
    const extractionStrategies = [
      // Strategy 1: Profile picture alt text
      async () => {
        const selectors = [
          'article header img[alt*="profile picture"]',
          'div[role="dialog"] img[alt*="profile picture"]',
          'img[alt*="profile picture"]',
          'header img[data-testid*="user-avatar"]',
          'a[href^="/"] img[alt*="profile picture"]'
        ];

        for (const selector of selectors) {
          try {
            console.error(`[v0] Trying selector: ${selector}`);
            await page.waitForSelector(selector, { timeout: 8000 });
            const element = await page.$(selector);

            if (element) {
              const altText = await element.evaluate(el => el.alt || '');
              console.error(`[v0] Alt text found: "${altText}"`);

              const match = altText.match(/([\w.]+)'s profile picture/i);
              if (match) {
                console.error(`[v0] Username from alt text: ${match[1]}`);
                return match[1];
              }
            }
          } catch (e) {
            console.error(`[v0] Selector ${selector} failed: ${e.message}`);
            continue;
          }
        }
        return null;
      },

      // Strategy 2: Username from profile links
      async () => {
        const linkSelectors = [
          'article header a[href^="/"][href$="/"]',
          'a[role="link"][href^="/"][href$="/"]',
          'header a[href^="/"]'
        ];

        for (const selector of linkSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const element of elements) {
              const href = await element.evaluate(el => el.href || el.getAttribute('href') || '');
              const username = extractUsernameFromUrl(href);

              if (username && !['p', 'reel', 'reels', 'tv', 'stories', 'explore'].includes(username)) {
                console.error(`[v0] Username from link: ${username}`);
                return username;
              }
            }
          } catch (e) {
            continue;
          }
        }
        return null;
      },

      // Strategy 3: Text content analysis
      async () => {
        try {
          const textContent = await page.evaluate(() => {
            // Look for username patterns in various elements
            const selectors = ['article', 'main', 'body'];
            for (const sel of selectors) {
              const element = document.querySelector(sel);
              if (element) return element.textContent || '';
            }
            return '';
          });

          // Enhanced username regex patterns
          const patterns = [
            /@([a-zA-Z0-9_.]+)/g,
            /instagram\.com\/([a-zA-Z0-9_.]+)/g,
            /"username":"([^"]+)"/g
          ];

          for (const pattern of patterns) {
            const matches = textContent.match(pattern);
            if (matches && matches.length > 0) {
              const username = matches[0].replace(/@|instagram\.com\/|"username":"/g, '').replace(/"/g, '');
              if (username && username.length > 0 && username.length < 30) {
                console.error(`[v0] Username from content: ${username}`);
                return username;
              }
            }
          }
        } catch (e) {
          console.error(`[v0] Content extraction error: ${e.message}`);
        }
        return null;
      },

      // Strategy 4: Page title analysis
      async () => {
        try {
          const title = await page.title();
          console.error(`[v0] Page title: "${title}"`);

          const titlePatterns = [
            /@([\w.]+)/,
            /\((@[\w.]+)\)/,
            /"([^"]+)" • Instagram/
          ];

          for (const pattern of titlePatterns) {
            const match = title.match(pattern);
            if (match && match[1]) {
              const username = match[1].replace('@', '');
              console.error(`[v0] Username from title: ${username}`);
              return username;
            }
          }
        } catch (e) {
          console.error(`[v0] Title extraction error: ${e.message}`);
        }
        return null;
      }
    ];

    // Execute extraction strategies sequentially
    for (let i = 0; i < extractionStrategies.length; i++) {
      try {
        console.error(`[v0] Executing strategy ${i + 1}...`);
        const result = await extractionStrategies[i]();
        if (result) {
          console.error(`[v0] Strategy ${i + 1} successful: ${result}`);
          return result;
        }
      } catch (error) {
        console.error(`[v0] Strategy ${i + 1} failed: ${error.message}`);
      }
    }

    // Check page content for login indicators
    const pageContent = await page.content();
    if (pageContent.includes('login') ||
      pageContent.includes('Login') ||
      pageContent.includes('log in') ||
      pageContent.includes('Sign up') ||
      pageContent.includes('Create account')) {
      console.error(`[v0] Login page detected in content`);
      return null;
    }

  } catch (e) {
    console.error(`[v0] Navigation/extraction error: ${e.message}`);

    // Enhanced retry logic
    if (retryCount < maxRetries) {
      const shouldRetry = (
        e.message.includes('timeout') ||
        e.message.includes('net::') ||
        e.message.includes('ERR_') ||
        e.message.includes('Navigation timeout') ||
        e.message.includes('Target closed') ||
        e.message.includes('Protocol error')
      );

      if (shouldRetry) {
        console.error(`[v0] Retrying due to recoverable error...`);
        return await getInstagramUsernameFromPost(page, permalinkUrl, retryCount + 1);
      }
    }
  }

  // Final fallback: URL-based extraction
  const urlUsername = extractUsernameFromUrl(permalinkUrl);
  if (urlUsername) {
    console.error(`[v0] Final fallback - URL username: ${urlUsername}`);
    return urlUsername;
  }

  console.error(`[v0] All extraction methods failed for: ${permalinkUrl}`);
  return null;
}

// Enhanced URL username extraction
function extractUsernameFromUrl(url) {
  if (!url) return null;

  const patterns = [
    /instagram\.com\/([a-zA-Z0-9_.]+)\/?(?:\?|$)/,
    /instagram\.com\/([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const username = match[1];
      // Filter out Instagram paths that aren't usernames
      if (!['p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'about', 'help'].includes(username)) {
        return username;
      }
    }
  }
  return null;
}

async function main() {
  console.error("[v0] Enhanced Instagram username extractor starting...");
  console.error("[v0] WARNING: Success rate may be low due to Instagram's 2025 anti-bot measures");

  // Extended timeout for Render environment
  const timeout = setTimeout(() => {
    console.error("[v0] Global timeout reached (10 minutes), exiting...");
    process.exit(1);
  }, 600000); // 10 minutes

  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  console.error(`[v0] Input received: ${input.substring(0, 200)}...`);

  let permalinks = [];
  try {
    const parsed = JSON.parse(input || "{}");
    permalinks = Array.isArray(parsed.permalinks) ? parsed.permalinks : [];
    console.error(`[v0] Processing ${permalinks.length} permalinks`);
  } catch (e) {
    console.error(`[v0] Input parsing error: ${e.message}`);
    process.exit(1);
  }

  if (permalinks.length === 0) {
    console.error("[v0] No permalinks to process");
    clearTimeout(timeout);
    return;
  }

  console.error("[v0] Launching browser with enhanced stealth...");
  const browserOptions = getBrowserOptions();
  console.error(`[v0] Browser config: headless=${browserOptions.headless}, args count=${browserOptions.args.length}`);

  let browser;
  try {
    browser = await puppeteer.launch(browserOptions);
    console.error("[v0] Browser launched successfully");
  } catch (error) {
    console.error(`[v0] Browser launch failed: ${error.message}`);

    // Enhanced fallback with different configurations
    const fallbackConfigs = [
      { ...browserOptions, executablePath: undefined },
      { ...browserOptions, executablePath: undefined, args: browserOptions.args.filter(arg => !arg.includes('--single-process')) },
      { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
    ];

    for (let i = 0; i < fallbackConfigs.length; i++) {
      try {
        console.error(`[v0] Trying fallback config ${i + 1}...`);
        browser = await puppeteer.launch(fallbackConfigs[i]);
        console.error(`[v0] Browser launched with fallback config ${i + 1}`);
        break;
      } catch (fallbackError) {
        console.error(`[v0] Fallback ${i + 1} failed: ${fallbackError.message}`);
        if (i === fallbackConfigs.length - 1) {
          console.error("[v0] All browser launch attempts failed");
          process.exit(1);
        }
      }
    }
  }

  let page;
  try {
    console.error("[v0] Creating and configuring page...");
    page = await browser.newPage();

    // Enhanced page configuration
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false
    });

    // Rotate user agents
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUA);
    console.error(`[v0] User agent: ${randomUA}`);

    // Enhanced HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });

    console.error("[v0] Page configuration completed");

  } catch (error) {
    console.error(`[v0] Page setup failed: ${error.message}`);
    await browser.close();
    process.exit(1);
  }

  // Process permalinks with enhanced rate limiting
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < permalinks.length; i++) {
    const url = permalinks[i];
    console.error(`[v0] Processing ${i + 1}/${permalinks.length}: ${url}`);

    try {
      const username = await getInstagramUsernameFromPost(page, url);

      if (username) {
        successCount++;
        console.error(`[v0] ✓ Success: ${username}`);
      } else {
        failureCount++;
        console.error(`[v0] ✗ Failed: null`);
      }

      process.stdout.write(JSON.stringify({ url, username }) + "\n");

    } catch (error) {
      failureCount++;
      console.error(`[v0] ✗ Error processing ${url}: ${error.message}`);
      process.stdout.write(JSON.stringify({ url, username: null }) + "\n");
    }

    // Enhanced progressive delays
    const baseDelay = 4000; // 4 seconds base
    const randomDelay = Math.random() * 6000; // 0-6 seconds random
    const progressiveDelay = Math.min(i * 500, 10000); // Progressive up to 10s
    const totalDelay = baseDelay + randomDelay + progressiveDelay;

    if (i < permalinks.length - 1) {
      console.error(`[v0] Waiting ${Math.round(totalDelay)}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  console.error(`[v0] Processing complete. Success: ${successCount}, Failed: ${failureCount}`);
  console.error(`[v0] Success rate: ${((successCount / permalinks.length) * 100).toFixed(1)}%`);

  await browser.close();
  console.error("[v0] Browser closed");

  clearTimeout(timeout);
  console.error("[v0] Enhanced Instagram extractor completed");
}

main().catch((error) => {
  console.error(`[v0] Fatal error: ${error.message}`);
  console.error(`[v0] Stack: ${error.stack}`);
  process.exit(1);
});