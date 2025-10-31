# 🆓 Hobby Plan - Puppeteer Alternatives

## ❌ The Problem

Vercel Hobby Plan has strict limits:
- **Memory**: 1024 MB (Chromium needs 2-3 GB)
- **Duration**: 10 seconds (Puppeteer often needs 20-30s)
- **Result**: Puppeteer **will fail or crash**

---

## ✅ Solution Options (Ranked by Recommendation)

### **Option 1: Use Browserless.io** ⭐ RECOMMENDED

You already have the code! Just add it to your fallback chain.

**Pros:**
- ✅ Works on Hobby plan
- ✅ No memory/timeout issues
- ✅ More reliable than self-hosted Puppeteer
- ✅ Pay-as-you-go pricing

**Cons:**
- 💰 Costs ~$10-50/month (pay per use)

**Implementation:**
File already exists: `src/lib/chatgpt-browserless.ts`

Add it to your fallback chain in:
`src/app/api/minutes/[id]/blocks/link/preview/route.ts`

```typescript
// After Puppeteer Lambda fails, try Browserless
try {
  console.log("Attempting Browserless.io...");
  const { fetchChatGPTShareBrowserless } = await import("@/lib/chatgpt-browserless");
  const raw = await fetchChatGPTShareBrowserless(url);
  // ... rest of code
} catch (browserlessError) {
  // Continue to next fallback
}
```

**Setup:**
1. Sign up at [browserless.io](https://www.browserless.io/)
2. Get API token
3. Add to Vercel env vars:
   ```
   BROWSERLESS_TOKEN=your_token_here
   BROWSERLESS_URL=https://production-sfo.browserless.io
   ```

---

### **Option 2: Upgrade to Vercel Pro** 💎

**Cost:** $20/month

**Limits:**
- Memory: 3008 MB ✅
- Duration: 300 seconds ✅
- Puppeteer: Works reliably ✅

**Simple upgrade:**
1. Go to Vercel dashboard
2. Settings → Billing
3. Upgrade to Pro

Then update `vercel.json`:
```json
"memory": 3008,
"maxDuration": 60
```

---

### **Option 3: Remove Puppeteer, Use Simple Fallbacks Only** ⚡ FREE

**Reality:** ChatGPT pages require JavaScript, so simple fetch will get limited HTML.

**What works:**
- ✅ Manual transcript input (already implemented)
- ❌ Automatic link parsing (ChatGPT blocks it)

**How to implement:**
1. Remove Puppeteer attempts
2. Show manual input UI immediately
3. Guide users to copy/paste conversation

**User experience:**
```
❌ Unable to automatically parse ChatGPT link
📋 Please copy and paste the conversation manually
```

---

### **Option 4: Deploy Puppeteer Function Separately** 🏗️

Host Puppeteer on a service with better limits:

**Options:**
- Railway.app (cheaper, more memory)
- Render.com (free tier with 512 MB)
- AWS Lambda with custom layer
- Self-hosted on cheap VPS ($5/month)

Call it from Vercel as an external API.

---

## 🎯 Recommendation

**For MVP/Testing:** Option 1 (Browserless.io)
- Quick to implement
- Reliable
- Only pay for what you use
- Can handle spikes

**For Production at Scale:** Option 2 (Vercel Pro)
- Better developer experience
- All-in-one solution
- Worth it if you have regular traffic

**For Zero Budget:** Option 3 (Manual input only)
- Works today
- No additional costs
- User does the work

---

## 🚀 Quick Deploy for Hobby Plan

Let's deploy with **minimal config** and let fallbacks handle it:

```json
// vercel.json - minimal config for Hobby plan
{
  "functions": {
    "src/app/api/minutes/[id]/blocks/link/preview/route.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  }
}
```

**What will happen:**
1. ❌ Puppeteer Lambda will fail (out of memory)
2. ❌ Regular Puppeteer will fail (out of memory)
3. ⚠️ Simple fetch might work (but limited HTML)
4. ⚠️ Cheerio might work (but limited HTML)
5. ✅ Manual input will always work

---

## 📊 Cost Comparison

| Solution | Monthly Cost | Setup Time | Reliability |
|----------|--------------|------------|-------------|
| Browserless.io | $10-50 | 10 min | ⭐⭐⭐⭐⭐ |
| Vercel Pro | $20 | 2 min | ⭐⭐⭐⭐ |
| Manual Only | $0 | 0 min | ⭐⭐⭐ |
| Self-hosted | $5+ | 2-4 hours | ⭐⭐⭐ |

---

## ⚡ Let's Deploy Now (Hobby Plan)

Current `vercel.json` is set to Hobby limits. Let's push:

```bash
git add vercel.json
git commit -m "config: adjust for Hobby plan limits"
git push origin main
```

**Expected behavior:**
- Puppeteer will fail → falls back to simple methods
- Manual input will always work
- Later you can add Browserless.io easily

---

**My recommendation:** Deploy now with Hobby plan, then add Browserless.io ($10-50/month is cheaper than Vercel Pro $20/month if you have low traffic).

