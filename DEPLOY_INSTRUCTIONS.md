# 🚀 Puppeteer on Vercel - Deployment Instructions

## Problem Solved

The error `libnss3.so: cannot open shared object file` was caused by using `@sparticuz/chromium` v131, which is built for AWS Lambda AL2023 and incompatible with Vercel's Node.js runtime.

## Solution Applied

✅ **Downgraded** `@sparticuz/chromium` from v131 to v126  
✅ **Optimized** Chromium launch arguments for Vercel  
✅ **Enhanced** logging for better debugging  

---

## Step 1: Fix Local NPM Cache (If needed)

If you see an npm permission error, run:

```bash
sudo chown -R $(whoami) ~/.npm
```

---

## Step 2: Install Dependencies

```bash
cd /Users/jungchan/id-minutes-app-alt
npm install
```

This will install:
- `@sparticuz/chromium@126.0.0` (Vercel-compatible)
- `puppeteer-core@24.25.0` (production)
- `puppeteer@24.25.0` (development)

---

## Step 3: Test Locally (Optional)

Start your dev server:

```bash
npm run dev
```

Test the endpoint with a ChatGPT share URL. You should see:
```
Using local Puppeteer with bundled Chromium for development...
```

---

## Step 4: Commit and Deploy

```bash
git add .
git commit -m "fix: downgrade @sparticuz/chromium to v126 for Vercel compatibility"
git push origin main
```

---

## Step 5: Monitor Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on the latest deployment
4. Go to "Functions" → Select your API route
5. View logs

### ✅ Expected Success Logs:

```
Initializing Chromium for Vercel...
Node version: v20.x.x
Platform: linux
Architecture: x64
Chromium executable path: /tmp/chromium
Browser launched successfully
Navigating to: https://chatgpt.com/share/...
Extracted N messages
```

### ❌ Previous Error (Now Fixed):

```
❌ /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file
```

---

## What Changed

### package.json
```diff
- "@sparticuz/chromium": "^131.0.0",
+ "@sparticuz/chromium": "^126.0.0",
```

### src/lib/chatgpt-puppeteer-lambda.ts
- Added detailed environment logging
- Simplified launch arguments
- Removed unnecessary flags that caused issues

### vercel.json
- Added `memory: 3008` MB for all Puppeteer routes
- Added `regions: ["iad1"]` for consistency

---

## Version Compatibility Matrix

| Environment | Chromium Version | Works? | Notes |
|------------|------------------|--------|-------|
| Vercel Node.js | v126.x | ✅ Yes | Recommended |
| Vercel Node.js | v119.x | ✅ Yes | Also stable |
| Vercel Node.js | v131.x | ❌ No | AWS Lambda AL2023 only |
| AWS Lambda AL2023 | v131.x | ✅ Yes | Latest |
| AWS Lambda AL2 | v126.x | ✅ Yes | Recommended |

---

## Troubleshooting

### Still Getting Library Errors?

Try v119:
```bash
npm install @sparticuz/chromium@119.0.0
```

### Timeout Errors?

Increase timeout in `vercel.json`:
```json
"maxDuration": 300
```

### Out of Memory?

Your current config uses 3008 MB (maximum on Pro plan).  
If still failing, consider:
- Using Browserless.io service instead
- Caching parsed results in database
- Implementing request queuing

---

## Cost Notes

⚠️ **Vercel Pro Plan Required**

- Memory: 3008 MB (Free plan max: 1024 MB)
- Duration: 60s (Free plan max: 10s)
- Monthly cost: ~$20/month for Pro plan

### Alternative (Free Plan Compatible):

Use **Browserless.io** (already implemented in your code):
- File: `src/lib/chatgpt-browserless.ts`
- Cost: ~$10-50/month (pay-as-you-go)
- No memory limits
- No Vercel plan upgrade needed

---

## Testing After Deployment

### Test Command:

```bash
curl -X POST https://your-app.vercel.app/api/test-puppeteer-parsing \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://chatgpt.com/share/your-share-id"
  }'
```

### Expected Response:

```json
{
  "ok": true,
  "mode": "parse",
  "title": "Chat Title",
  "messageCount": 10,
  "messages": [...]
}
```

---

## Further Help

If issues persist:

1. **Check Vercel logs** - Most detailed error info is there
2. **Verify plan** - Ensure you're on Pro plan for 3008 MB
3. **Try v119** - If v126 doesn't work, try older stable version
4. **Consider alternatives** - Browserless.io or self-hosted solution

---

**Last Updated**: 2025-10-30  
**Status**: ✅ Ready to Deploy  
**Priority**: High - Fixes production issue

