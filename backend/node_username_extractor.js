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

  // Extended Chrome executable paths for different environments
  let executablePath = undefined;
  const possiblePaths = [
    process.env.CHROMIUM_PATH,
    process.env.GOOGLE_CHROME_SHIM,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome-beta',
    '/snap/chromium/current/usr/lib/chromium-browser/chrome',
    // Codespaces/GitHub paths
    '/usr/bin/google-chrome-unstable',
    '/opt/google/chrome/chrome'
  ];

  for (const path of possiblePaths) {
    if (path && require('fs').existsSync(path)) {
      executablePath = path;
      console.error(`[v0] Using Chrome at: ${path}`);
      break;
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

    // Progressive delay for retries with human-like randomization
    if (retryCount > 0) {
      const baseDelay = retryCount * 5000; // 5s, 10s, 15s
      const randomDelay = Math.random() * 8000 + 2000; // 2-10s random
      const jitterDelay = Math.random() * 1000; // 0-1s jitter
      const delay = baseDelay + randomDelay + jitterDelay;
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

    // Pre-navigation with referrer simulation
    if (Math.random() < 0.7) {
      // Sometimes navigate via Google first (common user behavior)
      const googleSearch = `https://www.google.com/search?q=instagram+${extractUsernameFromUrl(permalinkUrl) || 'post'}`;
      try {
        await page.goto(googleSearch, { timeout: 15000, waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      } catch (e) {
        console.error(`[v0] Google referrer failed: ${e.message}`);
      }
    }

    // Navigate with enhanced wait conditions
    const response = await page.goto(permalinkUrl, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 60000,
      referer: Math.random() < 0.5 ? 'https://www.google.com/' : 'https://instagram.com/'
    });

    console.error(`[v0] Response status: ${response?.status()}`);
    console.error(`[v0] Final URL: ${page.url()}`);

    // Wait for page to fully render and handle login popup (like Selenium)
    const renderWait = 4000 + Math.random() * 4000; // 4-8 seconds random
    console.error(`[v0] Waiting ${Math.round(renderWait)}ms for page render and popup...`);
    await new Promise(resolve => setTimeout(resolve, renderWait));
    
    // Check for login/signup dialog popup (common Instagram behavior)
    try {
      const loginDialog = await page.$('div[role="dialog"]');
      if (loginDialog) {
        console.error(`[v0] Login/signup dialog detected - proceeding with extraction`);
        // Don't close the dialog - extract from it like Selenium does
      }
    } catch (e) {
      console.error(`[v0] No dialog popup detected`);
    }
    
    // Simulate human scrolling behavior
    await page.evaluate(() => {
      const scrollAmount = Math.random() * 500 + 100; // 100-600px scroll
      window.scrollTo({
        top: scrollAmount,
        behavior: 'smooth'
      });
    });
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800)); // 1.2-3s

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
      // Strategy 1: Profile picture alt text (Primary - matches Selenium approach)
      async () => {
        console.error(`[v0] Strategy 1: Profile picture alt text extraction`);
        
        // Primary selector - dialog popup (matches Selenium exactly)
        const dialogSelector = 'div[role="dialog"] img[contains(@alt, "profile picture")]';
        const cssDialogSelector = 'div[role="dialog"] img[alt*="profile picture"]';
        
        // Fallback selectors
        const selectors = [
          cssDialogSelector, // Primary - matches Selenium
          'article header img[alt*="profile picture"]',
          'img[alt*="profile picture"]',
          'header img[data-testid*="user-avatar"]',
          'a[href^="/"] img[alt*="profile picture"]',
          '[role="main"] img[alt*="profile picture"]'
        ];

        for (let i = 0; i < selectors.length; i++) {
          const selector = selectors[i];
          try {
            console.error(`[v0] Trying selector ${i + 1}: ${selector}`);
            
            // Wait for selector with longer timeout for dialog
            const timeout = i === 0 ? 15000 : 8000; // Longer for dialog
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
            
            const element = await page.waitForSelector(selector, { timeout });
            
            if (element) {
              // Simulate human-like mouse movement to element
              try {
                const box = await element.boundingBox();
                if (box) {
                  await page.mouse.move(
                    box.x + (box.width * 0.3) + Math.random() * (box.width * 0.4), 
                    box.y + (box.height * 0.3) + Math.random() * (box.height * 0.4)
                  );
                  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
                }
              } catch (moveError) {
                console.error(`[v0] Mouse move failed: ${moveError.message}`);
              }
              
              const altText = await element.evaluate(el => el.alt || el.getAttribute('alt') || '');
              console.error(`[v0] Alt text found: "${altText}"`);

              // Enhanced regex to match Selenium pattern exactly
              const patterns = [
                /(\S+)'s profile picture/i,
                /^([^']+)'s profile picture/i,
                /@([a-zA-Z0-9_.]+)'s profile picture/i,
                /([a-zA-Z0-9_.]+)'s\s+profile\s+picture/i
              ];

              for (const pattern of patterns) {
                const match = altText.match(pattern);
                if (match && match[1]) {
                  const username = match[1].replace('@', '').trim();
                  if (username && username.length > 0 && username.length < 30 && 
                      !username.includes(' ') && /^[a-zA-Z0-9_.]+$/.test(username)) {
                    console.error(`[v0] ✓ Username from alt text: ${username}`);
                    return username;
                  }
                }
              }
            }
          } catch (e) {
            console.error(`[v0] Selector ${i + 1} failed: ${e.message}`);
            // Random delay before trying next selector
            await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
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

      // Strategy 3: Enhanced DOM traversal (matches Selenium div traversal approach)
      async () => {
        console.error(`[v0] Strategy 3: Enhanced DOM traversal`);
        try {
          // Get all profile images and their parent containers
          const profileData = await page.evaluate(() => {
            const results = [];
            
            // Look for profile pictures in various containers
            const selectors = [
              'img[alt*="profile picture"]',
              'img[alt*="Profile picture"]', 
              'img[src*="profile"]',
              '[role="dialog"] img',
              'article img',
              'header img'
            ];
            
            selectors.forEach(sel => {
              const imgs = document.querySelectorAll(sel);
              imgs.forEach(img => {
                const alt = img.alt || img.getAttribute('alt') || '';
                const src = img.src || img.getAttribute('src') || '';
                
                // Get parent container info
                let container = img.closest('[role="dialog"]') ? 'dialog' : 
                              img.closest('article') ? 'article' : 
                              img.closest('header') ? 'header' : 'other';
                              
                if (alt.includes('profile picture') || alt.includes('Profile picture')) {
                  results.push({
                    alt: alt,
                    src: src,
                    container: container
                  });
                }
              });
            });
            
            return results;
          });
          
          // Process found profile images
          for (const data of profileData) {
            console.error(`[v0] Found profile image: ${data.alt} in ${data.container}`);
            
            const patterns = [
              /(\S+)'s profile picture/i,
              /^([^']+)'s profile picture/i,
              /@([a-zA-Z0-9_.]+)'s profile picture/i,
              /([a-zA-Z0-9_.]+)'s\s+profile\s+picture/i
            ];

            for (const pattern of patterns) {
              const match = data.alt.match(pattern);
              if (match && match[1]) {
                const username = match[1].replace('@', '').trim();
                if (username && username.length > 0 && username.length < 30 && 
                    !username.includes(' ') && /^[a-zA-Z0-9_.]+$/.test(username)) {
                  console.error(`[v0] ✓ Username from DOM traversal: ${username}`);
                  return username;
                }
              }
            }
          }
        } catch (e) {
          console.error(`[v0] DOM traversal error: ${e.message}`);
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

    // Randomized viewport configuration
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1600, height: 900 }
    ];
    
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
    await page.setViewport({
      ...randomViewport,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false
    });
    console.error(`[v0] Viewport: ${randomViewport.width}x${randomViewport.height}`);

    // Expanded user agent rotation with more realistic options
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0"
    ];

    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUA);
    console.error(`[v0] User agent: ${randomUA}`);

    // Enhanced HTTP headers with session simulation
    const languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-US,en;q=0.9,es;q=0.8'];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': randomLang,
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
      'Sec-CH-UA': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"'
    });
    
    // Simulate existing session cookies
    await page.setCookie({
      name: 'sessionid',
      value: 'fake_session_' + Math.random().toString(36).substr(2, 16),
      domain: '.instagram.com'
    }, {
      name: 'csrftoken', 
      value: 'csrf_' + Math.random().toString(36).substr(2, 32),
      domain: '.instagram.com'
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
        process.stdout.write(JSON.stringify({ url, username }) + "\n");
      } else {
        failureCount++;
        console.error(`[v0] ✗ Failed: null`);
        // Fallback: print permalink in a result container
        process.stdout.write(JSON.stringify({
          url,
          username: null,
          info: `No username found. Permalink: ${url}`,
          container: {
            type: 'fallback',
            content: `Permalink: ${url}`
          }
        }) + "\n");
      }
    } catch (error) {
      failureCount++;
      console.error(`[v0] ✗ Error processing ${url}: ${error.message}`);
      process.stdout.write(JSON.stringify({
        url,
        username: null,
        info: `Error occurred. Permalink: ${url}`,
        container: {
          type: 'fallback',
          content: `Permalink: ${url}`
        }
      }) + "\n");
    }

    // Selenium-like delays (shorter but still human-like)
    let baseDelay = 2000; // Base 2 seconds like Selenium time.sleep(2)
    if (failureCount > 0) {
      baseDelay += Math.min(failureCount * 2000, 10000); // Moderate backoff
    }
    
    const randomDelay = Math.random() * 3000 + 1000; // 1-4 seconds random
    const progressiveDelay = Math.min(i * 200, 5000); // Progressive up to 5s
    const jitterDelay = (Math.random() - 0.5) * 1000; // ±0.5s jitter
    const totalDelay = baseDelay + randomDelay + progressiveDelay + jitterDelay;

    if (i < permalinks.length - 1) {
      console.error(`[v0] Waiting ${Math.round(totalDelay)}ms before next request (failures: ${failureCount})...`);
      
      // Simple delay like Selenium but with some activity simulation
      await new Promise(resolve => setTimeout(resolve, totalDelay * 0.7));
      
      // Occasional micro-activity during wait
      if (Math.random() < 0.4) {
        try {
          await page.evaluate(() => {
            document.dispatchEvent(new Event('mousemove'));
            // Simulate slight page interaction
            if (Math.random() < 0.3) {
              window.scrollBy(0, Math.random() * 50 - 25);
            }
          });
        } catch (e) {
          // Ignore activity errors
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, totalDelay * 0.3));
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