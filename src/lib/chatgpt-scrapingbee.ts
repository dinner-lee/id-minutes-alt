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
      
      // Try multiple extraction strategies
      
      // Strategy 1: linear_conversation array
      let linear = data?.props?.pageProps?.serverResponse?.data?.linear_conversation;
      if (Array.isArray(linear) && linear.length > 0) {
        console.log('Using linear_conversation strategy');
        for (const item of linear) {
          const message = item.message || item;
          const role = message.author?.role || message.role || 'assistant';
          const parts = message.content?.parts || [];
          const content = Array.isArray(parts) ? parts.join(' ') : (message.content || '');
          
          if (['user', 'assistant'].includes(role) && content) {
            messages.push({ role: role as 'user' | 'assistant', content: String(content).trim() });
          }
        }
      }
      
      // Strategy 2: mapping object (most common for shared chats)
      if (messages.length === 0) {
        const mapping = data?.props?.pageProps?.serverResponse?.data?.mapping;
        if (mapping && typeof mapping === 'object') {
          console.log('Using mapping strategy, keys:', Object.keys(mapping).length);
          
          // Build parent-child relationships
          const nodes: any[] = Object.values(mapping);
          const rootNode = nodes.find(n => !n.parent);
          
          // Traverse tree in order
          const orderedMessages: any[] = [];
          const traverse = (nodeId: string) => {
            const node = mapping[nodeId];
            if (!node) return;
            
            const message = node.message;
            if (message && message.content) {
              const role = message.author?.role || 'assistant';
              if (['user', 'assistant'].includes(role)) {
                const parts = message.content.parts || [];
                const content = Array.isArray(parts) ? parts.filter((p: any) => p).join(' ') : '';
                if (content && content.trim()) {
                  orderedMessages.push({ role, content: content.trim(), create_time: message.create_time });
                }
              }
            }
            
            // Traverse children
            if (node.children && Array.isArray(node.children)) {
              for (const childId of node.children) {
                traverse(childId);
              }
            }
          };
          
          if (rootNode) {
            traverse(rootNode.id);
          }
          
          // Sort by create_time if available
          orderedMessages.sort((a, b) => (a.create_time || 0) - (b.create_time || 0));
          
          for (const msg of orderedMessages) {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          }
          
          console.log(`Extracted ${messages.length} messages from mapping tree`);
        }
      }
      
      // Strategy 3: Simple messages array fallback
      if (messages.length === 0) {
        const simpleMessages = data?.props?.pageProps?.messages || data?.messages;
        if (Array.isArray(simpleMessages)) {
          console.log('Using simple messages array strategy');
          for (const msg of simpleMessages) {
            const role = msg.role || msg.author?.role || 'assistant';
            const content = msg.content || msg.text || '';
            if (['user', 'assistant'].includes(role) && content) {
              messages.push({ role: role as 'user' | 'assistant', content: String(content).trim() });
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

