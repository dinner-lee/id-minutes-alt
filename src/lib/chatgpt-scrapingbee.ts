// src/lib/chatgpt-scrapingbee.ts
import { SharePayload, ChatRole } from './chatgpt-ingest';

/** ChatGPT parsing using ScrapingBee API */
export async function fetchChatGPTShareScrapingBee(url: string): Promise<SharePayload> {
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

  const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_API_KEY;
  
  if (!SCRAPINGBEE_KEY) {
    throw new Error("SCRAPINGBEE_API_KEY environment variable is not set");
  }

  console.log("Using ScrapingBee for ChatGPT parsing...");

  try {
    // Build ScrapingBee API URL
    const params = new URLSearchParams({
      api_key: SCRAPINGBEE_KEY,
      url: url,
      render_js: 'true',
      wait: '3000', // Wait 3 seconds for JS to load
      premium_proxy: 'false', // Set to 'true' if regular doesn't work
      country_code: 'us',
    });

    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?${params.toString()}`;
    
    console.log(`Fetching via ScrapingBee: ${url}`);
    
    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ScrapingBee error response:', errorText);
      throw new Error(`ScrapingBee request failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Received HTML: ${html.length} characters`);

    // Check remaining API credits
    const remainingCredits = response.headers.get('spb-credits-remaining');
    if (remainingCredits) {
      console.log(`ScrapingBee credits remaining: ${remainingCredits}`);
    }

    // Parse the HTML to extract conversation data
    const conversationData = extractConversationFromHtml(html);

    console.log(`Extracted ${conversationData.messages.length} messages`);
    
    if (conversationData.messages.length === 0) {
      throw new Error("Could not extract any conversation messages from the page");
    }

    return {
      title: conversationData.title,
      messages: conversationData.messages
    };

  } catch (error: any) {
    console.error("ScrapingBee parsing failed:", error);
    
    if (error.message?.includes('timeout')) {
      throw new Error(`Request timeout: ChatGPT page took too long to load via ScrapingBee.`);
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error(`ScrapingBee authentication failed. Check your API key.`);
    } else if (error.message?.includes('402')) {
      throw new Error(`ScrapingBee credits exhausted. Please upgrade your plan.`);
    } else {
      throw new Error(`ScrapingBee parsing failed: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Extract conversation data from HTML
 * This uses similar logic to the Puppeteer page.evaluate() but works with raw HTML
 */
function extractConversationFromHtml(html: string): { title: string; messages: Array<{role: "user" | "assistant", content: string}> } {
  const messages: Array<{role: "user" | "assistant", content: string}> = [];
  let title = "Shared Chat";

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Try to extract from __NEXT_DATA__ script
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      
      // Extract title
      title = data?.props?.pageProps?.meta?.title || 
              data?.props?.pageProps?.title || 
              data?.props?.pageProps?.serverResponse?.data?.title ||
              data?.title || title;
      
      // Extract messages from various possible locations
      const messagesData = data?.props?.pageProps?.serverResponse?.data?.linear_conversation ||
                          data?.props?.pageProps?.serverResponse?.messages ||
                          data?.props?.pageProps?.messages ||
                          data?.props?.messages ||
                          data?.messages;
      
      if (Array.isArray(messagesData)) {
        for (const msg of messagesData) {
          if (msg && typeof msg === 'object') {
            // Handle different message structures
            const msgRole = msg.role || msg.author?.role || msg.author_role || 'assistant';
            
            // Extract content from various structures
            let content = '';
            
            if (typeof msg.content === 'string') {
              content = msg.content;
            } else if (msg.message?.content) {
              if (typeof msg.message.content === 'string') {
                content = msg.message.content;
              } else if (msg.message.content.parts) {
                content = msg.message.content.parts.join(' ');
              }
            } else if (msg.content?.parts) {
              content = msg.content.parts.join(' ');
            } else if (Array.isArray(msg.content)) {
              content = msg.content
                .map((part: any) => typeof part === 'string' ? part : part?.text || '')
                .filter(Boolean)
                .join(' ');
            }
            
            if (content && content.trim()) {
              messages.push({
                role: msgRole === 'user' ? 'user' : 'assistant',
                content: content.trim()
              });
            }
          }
        }
      }
    } catch (e) {
      console.log('Failed to parse __NEXT_DATA__:', e);
    }
  }

  // Fallback: Try to extract from DOM structure (if __NEXT_DATA__ failed)
  if (messages.length === 0) {
    // Look for data-message-author-role attributes
    const messageRegex = /data-message-author-role="(user|assistant)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/[^>]+>/gi;
    let match;
    
    while ((match = messageRegex.exec(html)) !== null) {
      const role = match[1] as "user" | "assistant";
      const content = match[2]
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (content && content.length > 10) {
        const isUIElement = /Continue this conversation|Log in|Sign up|Share|Copy/i.test(content);
        if (!isUIElement) {
          messages.push({ role, content });
        }
      }
    }
  }

  return { title, messages };
}

