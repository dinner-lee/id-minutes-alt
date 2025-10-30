# Puppeteer Lambda on Vercel - Fixed Issues ✅

## Problems Identified and Fixed

### 1. ❌ **Missing Memory Configuration (CRITICAL)**
**Problem**: Vercel serverless functions default to 1024 MB memory, which is insufficient for Chromium/Puppeteer operations. Chromium typically needs 2-3 GB of memory to run properly.

**Solution**: Added `"memory": 3008` to all Puppeteer-related API routes in `vercel.json`.

---

### 2. ✅ **Proper Puppeteer Package Structure**
**Problem**: Need different Puppeteer setups for local vs Vercel environments.

**Solution**: 
- Added `puppeteer` as **devDependency** (for local development with bundled Chromium)
- Kept `puppeteer-core` as **dependency** (for Vercel with `@sparticuz/chromium`)
- Code automatically detects environment and uses appropriate package

---

### 3. ❌ **Insufficient Error Logging**
**Problem**: When Puppeteer fails on Vercel, error messages weren't providing enough information to diagnose the issue.

**Solution**: Enhanced error handling with:
- Detailed environment information (Node version, platform, memory usage)
- Specific error messages for common failure scenarios
- Stack traces for debugging

---

### 4. ⚠️ **Non-Optimized Chromium Arguments**
**Problem**: Chromium launch arguments weren't fully optimized for serverless environments.

**Solution**: Added additional Chrome flags:
- `--no-zygote`: Prevents spawning helper processes
- `--disable-web-security`: Helps with cross-origin issues
- `--disable-features=IsolateOrigins,site-per-process`: Reduces memory overhead
- `protocolTimeout: 60000`: Prevents protocol timeout errors

---

### 5. ℹ️ **Region Configuration**
**Added**: Set default region to `iad1` (US East) for consistent deployment.

---

## Files Modified

1. ✅ `vercel.json` - Added memory configuration and regions
2. ✅ `package.json` - Removed redundant `puppeteer` package
3. ✅ `src/lib/chatgpt-puppeteer-lambda.ts` - Enhanced error handling and Chromium args
4. ✅ `next.config.ts` - (Already configured correctly with outputFileTracingIncludes)

---

## Deployment Steps

### Step 1: Install Dependencies
```bash
npm install
```

This will install:
- `puppeteer-core` (production dependency) - for Vercel
- `puppeteer` (dev dependency) - for local development with bundled Chromium

**Note**: You don't need to install Chrome manually - the `puppeteer` dev dependency includes Chromium!

### Step 2: Test Locally
```bash
npm run dev
```

The code will automatically use the bundled Chromium from `puppeteer` when running locally.

### Step 3: Commit and Deploy to Vercel
```bash
git add .
git commit -m "fix: configure Puppeteer for Vercel deployment with proper memory settings"
git push origin main
```

Vercel will automatically deploy your changes.

---

## Monitoring and Debugging

### View Logs on Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Click on "Deployments"
4. Click on the latest deployment
5. Go to "Functions" tab
6. Select the failing function
7. View logs

### Common Error Messages and Solutions

#### Error: "Task timed out after X seconds"
**Cause**: Function taking too long or memory limit reached
**Solution**: 
- Increase `maxDuration` (currently set to 60s, max is 300s on Pro plan)
- Increase `memory` (currently set to 3008 MB)

#### Error: "Could not find Chrome"
**Cause**: Chromium binary not properly included in deployment
**Solution**: Check that `next.config.ts` has `outputFileTracingIncludes` configured (already done)

#### Error: "ENOMEM" or "JavaScript heap out of memory"
**Cause**: Insufficient memory
**Solution**: Increase `memory` in `vercel.json` (Pro plan allows up to 3008 MB)

#### Error: "libnss3.so: cannot open shared object file" or similar library errors
**Cause**: Incompatible `@sparticuz/chromium` version for Vercel's runtime
**Solution**: Use `@sparticuz/chromium` v126.x or v119.x (v131+ is for AWS Lambda AL2023, not compatible with Vercel)
```bash
npm install @sparticuz/chromium@126.0.0
```

#### Error: "Protocol error"
**Cause**: Chromium crashed or timed out
**Solution**: 
- Check memory settings
- Ensure `protocolTimeout` is set (already done)
- Consider simplifying the page navigation

---

## Vercel Plan Requirements

⚠️ **Important**: Some features require specific Vercel plans:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Max Memory | 1024 MB | 3008 MB | 3008 MB |
| Max Duration | 10s | 300s | 900s |
| Puppeteer Support | ❌ Limited | ✅ Yes | ✅ Yes |

**Current Configuration**: Requires **Pro Plan** or higher (using 3008 MB memory)

If you're on a Free plan, reduce memory to 1024 MB, but Puppeteer might fail:
```json
"memory": 1024
```

---

## Alternative Solutions

If Puppeteer still doesn't work on Vercel, consider these alternatives:

### 1. **Use Browserless.io** (Recommended for Free Plan)
- External service that provides browser automation
- Already implemented in your codebase: `src/lib/chatgpt-browserless.ts`
- Costs ~$10-50/month depending on usage

### 2. **Use Edge Functions with Limited Puppeteer**
- Switch to Vercel Edge Runtime
- More limited but might work for simple cases

### 3. **Use External Service**
- AWS Lambda with Puppeteer Layer
- Google Cloud Functions with Puppeteer
- Self-hosted solution

---

## Testing the Fix

### Test Endpoint
```bash
curl -X POST https://your-app.vercel.app/api/test-puppeteer-parsing \
  -H "Content-Type: application/json" \
  -d '{"url": "https://chatgpt.com/share/your-share-id"}'
```

### Expected Success Response
```json
{
  "ok": true,
  "mode": "parse",
  "title": "Chat Title",
  "messageCount": 10,
  "messages": [...]
}
```

### Expected Error Response (Before Fix)
```json
{
  "ok": false,
  "error": "Browser launch failed: ...",
  "stack": "..."
}
```

---

## Next Steps After Deployment

1. ✅ Deploy to Vercel
2. ✅ Check deployment logs for any errors
3. ✅ Test the API endpoint with a real ChatGPT share URL
4. ✅ Monitor memory usage in Vercel dashboard
5. ✅ Adjust `maxDuration` if needed (increase if timeouts occur)

---

## Additional Notes

### Why 3008 MB Memory?
- Chromium typically uses 1.5-2.5 GB when running
- Additional overhead for Node.js runtime and Next.js
- 3008 MB is the maximum on Vercel Pro plan
- Provides buffer for complex pages

### Why Two Puppeteer Packages?
**Local Development**:
- Uses `puppeteer` (devDependency) with bundled Chromium
- Automatically downloads Chromium (~300MB) during install
- No manual Chrome installation needed
- Works out of the box on macOS, Linux, Windows

**Vercel Production**:
- Uses `puppeteer-core` (dependency) - lightweight, no bundled browser
- Pairs with `@sparticuz/chromium` for serverless-optimized Chromium
- Binary is extracted to `/tmp` at runtime
- Only production dependencies are deployed to Vercel (saves space)

### Why @sparticuz/chromium?
- Pre-compiled Chromium binary optimized for AWS Lambda and Vercel
- Automatically extracts to /tmp on serverless
- Includes all necessary dependencies (fonts, libraries)
- Well-maintained and actively updated
- Much smaller than bundling full Chromium

### Performance Tips
- Keep pages loading simple (avoid waiting for all resources)
- Use `waitUntil: 'domcontentloaded'` instead of `networkidle0` for faster loading
- Consider caching parsed results in your database
- Implement request queuing to prevent multiple simultaneous browser instances

---

## Support

If issues persist after deployment:

1. **Check Vercel Logs** - Most errors show detailed stack traces
2. **Verify Plan** - Ensure you're on Pro plan for 3008 MB memory
3. **Test Locally** - Confirm it works locally first
4. **Contact Vercel Support** - They can help with serverless function issues

---

**Last Updated**: 2025-10-30
**Vercel Config Version**: 1.0
**Tested With**: 
- Next.js 15.5.6
- puppeteer-core 24.25.0
- @sparticuz/chromium 126.0.0 (compatible with Vercel Node.js runtime)

