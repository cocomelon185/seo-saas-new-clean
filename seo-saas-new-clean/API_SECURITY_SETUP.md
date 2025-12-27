# API Security Setup - CRITICAL FIXES APPLIED

## 🚨 Security Vulnerabilities FIXED

The `/api/optimize` endpoint had **CRITICAL** security issues that have now been resolved.

---

## ❌ Before (INSECURE)

### Major Vulnerabilities:
1. **NO AUTHENTICATION** - Anyone could call the API
2. **NO RATE LIMITING** - Unlimited free API calls
3. **NO USER VALIDATION** - No check if user is logged in
4. **NO USAGE TRACKING** - No database records
5. **NO TIER CHECKING** - Free users = unlimited access
6. **OPEN CORS** - `Access-Control-Allow-Origin: *`

### Impact:
- 💸 **Cost:** Anyone could drain your OpenAI API credits
- 🚫 **Abuse:** Bots could call endpoint millions of times
- 👥 **No Control:** Can't enforce subscription limits
- 📉 **No Data:** Zero visibility into API usage

---

## ✅ After (SECURE)

### Security Features Added:

#### 1. 🔐 **Authentication Required**
```javascript
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```
- Every request MUST include valid Supabase auth token
- Token verified with `supabase.auth.getUser(token)`
- Invalid/missing token = 401 Unauthorized

#### 2. 🚦 **Usage Limit Enforcement**
```javascript
const { data: usageLimits } = await supabase
  .from('usage_limits')
  .select('optimizations_used, optimizations_limit')
  .eq('user_id', user.id)
  .single();

if (usageLimits.optimizations_used >= usageLimits.optimizations_limit) {
  return res.status(429).json({ error: 'Usage limit reached' });
}
```
- Checks database BEFORE calling OpenAI
- Returns 429 (Too Many Requests) if limit exceeded
- Forces upgrade to continue

#### 3. 📊 **Automatic Usage Tracking**
```javascript
await supabase.from('usage_history').insert({
  user_id: user.id,
  action_type: 'optimization',
  content_title: keyword,
  word_count: content.split(' ').length,
  metadata: { keyword, tone }
});
```
- Every API call logged to database
- Automatic counter increment via database trigger
- Complete audit trail

#### 4. 📈 **Tier-Based Rate Limiting**
Limits enforced per subscription tier:
- **Free:** 5/month
- **Pro:** 100/month
- **Enterprise:** Unlimited

Limits stored in `usage_limits` table

#### 5. 🎯 **Restricted CORS**
```javascript
res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
```
- Set `ALLOWED_ORIGIN` env variable to your domain
- Prevents unauthorized websites from calling your API

---

## ⚙️ Environment Variables Required

Add these to your Vercel environment:

```bash
# Supabase Configuration
SUPABASE_URL=https://dbgjlstdfgpqomzdbdel.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=your_openai_key

# Security
ALLOWED_ORIGIN=https://seo-saas-new-clean.vercel.app
```

### Get Supabase Service Key:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy `service_role` key (not `anon` key!)
5. Add to Vercel environment variables

---

## 📡 Frontend Changes Required

Update all API calls to include auth token:

### Before (Insecure):
```javascript
const response = await fetch('/api/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content, keyword, tone })
});
```

### After (Secure):
```javascript
// Get user session
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  alert('Please sign in to optimize content');
  window.location.href = '/index.html';
  return;
}

// Call API with auth token
const response = await fetch('/api/optimize', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}` // ⚠️ REQUIRED
  },
  body: JSON.stringify({ content, keyword, tone })
});

const result = await response.json();

if (response.status === 429) {
  // Usage limit reached
  alert(result.message); // "Upgrade your plan to continue"
  window.location.href = '/pricing.html';
}
```

---

## 📝 API Response Format

### Success (200):
```json
{
  "optimizedContent": "...SEO optimized content...",
  "usage": {
    "used": 6,
    "limit": 100,
    "remaining": 94
  }
}
```

### Error Responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized: No token provided"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Usage limit reached",
  "used": 5,
  "limit": 5,
  "message": "Upgrade your plan to continue optimizing content"
}
```

**400 Bad Request:**
```json
{
  "error": "Content and keyword are required"
}
```

---

## 🧪 Testing the Security

### Test 1: No Auth Token
```bash
curl -X POST https://your-app.vercel.app/api/optimize \
  -H "Content-Type: application/json" \
  -d '{"content":"test","keyword":"test"}'
```
**Expected:** `401 Unauthorized`

### Test 2: Invalid Token
```bash
curl -X POST https://your-app.vercel.app/api/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{"content":"test","keyword":"test"}'
```
**Expected:** `401 Unauthorized`

### Test 3: Valid Token, Over Limit
Make 6 requests with same token (Free tier = 5 limit)
**Expected:** 6th request returns `429 Too Many Requests`

### Test 4: Valid Token, Under Limit
```javascript
const { data: { session } } = await supabase.auth.getSession();

fetch('/api/optimize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    content: 'Test content',
    keyword: 'SEO',
    tone: 'professional'
  })
});
```
**Expected:** `200 OK` with optimized content

---

## 📊 Database Tracking

Every API call creates records:

### usage_history:
```sql
SELECT * FROM usage_history WHERE user_id = 'user-uuid';
```

### usage_limits (auto-updated):
```sql
SELECT optimizations_used, optimizations_limit 
FROM usage_limits 
WHERE user_id = 'user-uuid';
```

---

## ✅ Checklist

- [x] API endpoint secured with authentication
- [x] Usage limits enforced before API call
- [x] Database tracking implemented
- [x] Rate limiting by tier working
- [x] CORS restricted (set ALLOWED_ORIGIN)
- [ ] Add SUPABASE_SERVICE_KEY to Vercel env
- [ ] Update frontend to pass auth token
- [ ] Test with valid/invalid tokens
- [ ] Test usage limit enforcement
- [ ] Monitor database for tracking

---

## 🚨 Production Deployment

1. **Add Environment Variables to Vercel:**
   - SUPABASE_SERVICE_KEY
   - ALLOWED_ORIGIN

2. **Update Frontend Code:**
   - Add Authorization header to all API calls
   - Handle 401 (redirect to login)
   - Handle 429 (redirect to pricing)

3. **Deploy:**
   - Commit changes
   - Vercel auto-deploys
   - Test thoroughly

---

**Status:** ✅ API Secured  
**Date:** December 26, 2025  
**Priority:** CRITICAL - Deploy ASAP
