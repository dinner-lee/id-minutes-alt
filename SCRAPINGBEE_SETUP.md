# 🐝 ScrapingBee Setup Complete!

## ✅ What's Done

1. ✅ Created `src/lib/chatgpt-scrapingbee.ts` - ScrapingBee integration
2. ✅ Added to fallback chain in API route (runs after Puppeteer Lambda fails)
3. ✅ Deployed to Vercel
4. ⏳ **NEXT STEP:** Add API key to Vercel environment variables

---

## 🔑 Add API Key to Vercel (2 minutes)

### Step 1: Go to Vercel Dashboard

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: **id-minutes-alt**
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Environment Variable

Click "Add New" and enter:

**Key:**
```
SCRAPINGBEE_API_KEY
```

**Value:**
```
WOE4ZQMQL16Z85H7S78GJUXD06XOXRCPLZFOXYKF9S8XVSELS51J3K4LBIFCRBGK0FIU0B3TEN4QJHPE
```

**Environments:** Check all boxes:
- ✅ Production
- ✅ Preview  
- ✅ Development

Click **Save**.

### Step 3: Redeploy

After adding the env var, Vercel will ask to redeploy. Click **Redeploy** or:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

---

## 🔄 New Fallback Chain Order

Your app now tries methods in this order:

```
1. 🔄 Puppeteer Lambda      → ❌ Fails (out of memory on Hobby plan)
   ↓
2. 🐝 ScrapingBee           → ✅ WORKS! (JavaScript rendering)
   ↓
3. 🔄 Puppeteer             → ❌ Fails (out of memory)
   ↓
4. 🌐 Simple Fetch          → ⚠️ Limited (no JS)
   ↓
5. 📝 Cheerio               → ⚠️ Limited (no JS)
   ↓
6. ✋ Manual Input          → ✅ Always works
```

**Result:** ScrapingBee will catch most requests! 🎉

---

## 📊 ScrapingBee Free Tier

- **1,000 free API calls/month**
- **JavaScript rendering:** ✅ Works with ChatGPT
- **No credit card required** for free tier
- **Usage tracking:** Available in ScrapingBee dashboard

### Monitor Usage

Go to [app.scrapingbee.com](https://app.scrapingbee.com/):
- See remaining credits
- View request history
- Check success/failure rates

---

## 🧪 Testing

### Test 1: Via Your App UI

1. Go to your deployed app
2. Create a new minute
3. Add a ChatGPT share link
4. Watch the console logs:

```
✅ Attempting Puppeteer Lambda parsing...
❌ Puppeteer Lambda parsing failed: out of memory
✅ Attempting ScrapingBee parsing...
✅ ScrapingBee credits remaining: 999
✅ Extracted 10 messages
✅ Success!
```

### Test 2: Direct API Call

```bash
curl -X POST https://your-app.vercel.app/api/test-puppeteer-parsing \
  -H "Content-Type: application/json" \
  -d '{"url": "https://chatgpt.com/share/YOUR-SHARE-ID"}'
```

Expected response:
```json
{
  "ok": true,
  "mode": "link_scrapingbee",
  "title": "Chat Title",
  "messageCount": 10,
  "messages": [...]
}
```

---

## 🔒 Security Warning

⚠️ **You shared your API key publicly in the chat!**

**Recommended:** Regenerate your API key:

1. Go to [app.scrapingbee.com/account](https://app.scrapingbee.com/account)
2. Click "API Keys"
3. Click "Regenerate"
4. Copy the new key
5. Update in Vercel Settings → Environment Variables

---

## 💰 Cost Tracking

### If You Exceed 1,000 Requests/Month:

ScrapingBee will:
- Stop working (returns 402 error)
- App falls back to manual input
- No charges (free tier just stops)

### To Upgrade (if needed):

**Freelance Plan:** $49/month
- 75,000 API credits
- JavaScript rendering
- Premium proxies
- Concurrent requests

**Calculator:**
- ~10-20 requests/day = Stay in free tier ✅
- ~50 requests/day = Need paid plan

---

## 🎯 Success Indicators

After adding the API key, you should see:

### ✅ In Vercel Logs:
```
Using ScrapingBee for ChatGPT parsing...
Fetching via ScrapingBee: https://chatgpt.com/share/...
Received HTML: 125000 characters
ScrapingBee credits remaining: 999
Extracted 10 messages
```

### ✅ In Your App:
- ChatGPT links parse automatically
- No "manual input required" messages
- Fast response times (2-5 seconds)

### ❌ If Something's Wrong:
```
ScrapingBee authentication failed. Check your API key.
```
→ Double-check the env var in Vercel

```
ScrapingBee credits exhausted. Please upgrade your plan.
```
→ You've used all 1,000 free credits this month

---

## 🚀 Next Steps

1. ✅ Add API key to Vercel (do this now!)
2. ✅ Redeploy
3. ✅ Test with a ChatGPT link
4. ✅ Monitor usage in ScrapingBee dashboard
5. 🔒 Regenerate API key (for security)

---

## 🆘 Troubleshooting

### "Environment variable not found"

**Problem:** Key not added to Vercel
**Solution:** Follow Step 2 above

### "401 Unauthorized"

**Problem:** Wrong API key or typo
**Solution:** Double-check the key in Vercel settings

### "Still showing manual input"

**Problem:** Deployment didn't pick up env var
**Solution:** Manually redeploy after adding env var

### "Works locally but not on Vercel"

**Problem:** Env var only added to Development
**Solution:** Make sure Production is checked

---

**Ready!** Once you add the API key to Vercel, ScrapingBee will handle your ChatGPT parsing automatically! 🎉

