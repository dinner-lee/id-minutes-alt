// src/lib/chatgpt-puppeteer-lambda.ts
import { SharePayload, ChatRole } from './chatgpt-ingest';

/** ChatGPT parsing using Puppeteer with @sparticuz/chromium for Vercel */
export async function fetchChatGPTSharePuppeteerLambda(url: string): Promise<SharePayload> {
  const ALLOWED_HOSTS = new Set([
    "chatgpt.com",
    "chat.openai.com",
    "shareg.pt"
  ]);

  function isAllowedShareUrl(urlStr: string) {
    try {
      const u = new URL(urlStr);
      if (!ALLOWED_HOSTS.has(u.hostname)) return false;
      return u.hostname === "shareg.pt" || u.pathname.startsWith("/share/");
    } catch {
      return false;
    }
  }

  if (!isAllowedShareUrl(url)) {
    throw new Error("Invalid ChatGPT share URL");
  }

  console.log("Using Puppeteer with @sparticuz/chromium for ChatGPT parsing...");

  try {
    // Import Puppeteer and chromium dynamically
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');

    // Configure for Vercel deployment
    const isVercel = process.env.VERCEL === '1';
    
    let browser;
    if (isVercel) {
      console.log('Initializing Chromium for Vercel...');
      
      // Set environment for library paths
      process.env.LD_LIBRARY_PATH = [
        '/tmp',
        '/tmp/lib',
        process.env.LD_LIBRARY_PATH,
      ].filter(Boolean).join(':');
      
      const execPath = await chromium.default.executablePath();
      
      browser = await puppeteer.default.launch({
        args: [
          ...chromium.default.args,
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--single-process',
        ],
        executablePath: execPath,
        headless: chromium.default.headless,
        defaultViewport: chromium.default.defaultViewport,
        ignoreHTTPSErrors: true,
      });
      
      console.log('Browser launched successfully');
    } else {
      // Use local Chrome for development
      const puppeteerLocal = await import('puppeteer');
      browser = await puppeteerLocal.default.launch({
        headless: true,
        args: ['--no-sandbox'],
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    
    // Set timeouts
    page.setDefaultNavigationTimeout(30000);
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`Navigating to: ${url}`);
    
    // Navigate and wait
    await page.goto(url, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });
    
    // Wait for conversation content
    try {
      await page.waitForSelector('[data-message-author-role]', {
        timeout: 20000,
      });
    } catch (e) {
      console.log("Conversation elements not found, proceeding anyway...");
    }
    
    // Additional wait for dynamic content
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
    });

    // Extract conversation data
    const conversationData = await page.evaluate(() => {
      const messages: Array<{role: "user" | "assistant", content: string}> = [];
      let title = "Shared Chat";

      // Get title
      const titleEl = document.querySelector('title');
      if (titleEl) {
        title = titleEl.textContent || title;
      }

      // Extract from __NEXT_DATA__
      const nextDataScript = document.querySelector('script#__NEXT_DATA__');
      if (nextDataScript) {
        try {
          const data = JSON.parse(nextDataScript.textContent || '');
          
          title = data?.props?.pageProps?.meta?.title || 
                  data?.props?.pageProps?.title || 
                  data?.title || title;
          
          const messagesData = data?.props?.pageProps?.serverResponse?.messages ||
                              data?.props?.pageProps?.messages ||
                              data?.props?.messages ||
                              data?.messages;
          
          if (Array.isArray(messagesData)) {
            for (const msg of messagesData) {
              if (msg && typeof msg === 'object') {
                const msgRole = msg.role || msg.author_role || 'assistant';
                const content = msg.content || msg.text || msg.message || '';
                
                if (typeof content === 'string' && content.trim()) {
                  messages.push({
                    role: msgRole === 'user' ? 'user' : 'assistant',
                    content: content.trim()
                  });
                } else if (Array.isArray(content)) {
                  // Handle array content
                  const text = content
                    .map(part => typeof part === 'string' ? part : part?.text || '')
                    .filter(Boolean)
                    .join(' ');
                  if (text) {
                    messages.push({
                      role: msgRole === 'user' ? 'user' : 'assistant',
                      content: text
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.log('Failed to parse __NEXT_DATA__:', e);
        }
      }

      // Fallback to DOM extraction if no messages
      if (messages.length === 0) {
        const messageElements = document.querySelectorAll('[data-message-author-role]');
        messageElements.forEach((el) => {
          const role = el.getAttribute('data-message-author-role');
          const text = el.textContent?.trim();
          
          if (text && text.length > 10) {
            const isUIGlement = /Continue this conversation|Log in|Sign up|Share|Copy/i.test(text);
            if (!isUIGlement) {
              messages.push({
                role: role === 'user' ? 'user' : 'assistant',
                content: text
              });
            }
          }
        });
      }

      return { title, messages };
    });

    console.log(`Extracted ${conversationData.messages.length} messages`);
    
    if (conversationData.messages.length === 0) {
      throw new Error("Could not extract any conversation messages from the page");
    }

    await browser.close();

    return {
      title: conversationData.title,
      messages: conversationData.messages
    };

  } catch (error: any) {
    console.error("Puppeteer Lambda parsing failed:", error);
    
    if (error.message?.includes('timeout')) {
      throw new Error(`Request timeout: ChatGPT page took too long to load.`);
    } else {
      throw new Error(`Puppeteer Lambda parsing failed: ${error.message || 'Unknown error'}`);
    }
  }
}
