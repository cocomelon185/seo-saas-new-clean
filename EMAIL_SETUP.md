# Email Notification Setup Guide

## Overview

This application uses **Resend** for transactional emails:
- **Free Tier**: 3,000 emails/month (100 emails/day)
- **Deliverability**: Better than SendGrid
- **Developer-Friendly**: Simple API, great documentation

## Email Types Implemented

### 1. Welcome Email 🎉
- **Trigger**: When new user signs up
- **Content**: Welcome message, feature overview, CTA to dashboard
- **Sent via**: Supabase database trigger

### 2. Usage Warning Emails ⚠️
- **Trigger**: At 80% and 90% of monthly limit
- **Content**: Current usage stats, remaining credits, upgrade CTA
- **Sent via**: API optimize endpoint

### 3. Limit Reached Email 🚫
- **Trigger**: When user reaches 100% of monthly limit  
- **Content**: Limit notification, upgrade benefits, pricing link
- **Sent via**: API optimize endpoint

### 4. Referral Success Email 🎁
- **Trigger**: When referred user signs up
- **Content**: Congratulations, bonus credits notification
- **Sent via**: Signup process with referral tracking

## Setup Instructions

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email
4. Navigate to API Keys section
5. Create a new API key

### Step 2: Add Resend API Key to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `seo-saas-new-clean`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Key: RESEND_API_KEY
   Value: re_xxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your application

### Step 3: Configure Supabase Email Templates (Optional)

Supabase can send built-in auth emails (password reset, email confirmation):

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Customize templates for:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### Step 4: Test Email Sending

```javascript
// Test in browser console or API
const { sendWelcomeEmail } = require('./lib/emailService');

await sendWelcomeEmail('test@example.com');
```

## Integration Points

### api/optimize.js

Already integrated with usage tracking:

```javascript
// Check usage and send emails
const { data: usageData } = await supabase
  .from('usage_history')
  .select('*')
  .eq('user_id', user.id);

const usedCount = usageData.length;
const limit = usageLimits.monthly_limit;
const percentage = (usedCount / limit) * 100;

// Send warning at 80%
if (percentage === 80) {
  const { sendUsageWarning } = require('../lib/emailService');
  await sendUsageWarning(user.email, {
    used: usedCount,
    limit: limit,
    remaining: limit - usedCount,
    percentage: 80
  });
}

// Send warning at 90%  
if (percentage === 90) {
  await sendUsageWarning(user.email, {
    used: usedCount,
    limit: limit,
    remaining: limit - usedCount,
    percentage: 90
  });
}

// Send limit reached
if (usedCount >= limit) {
  const { sendUsageLimitReached } = require('../lib/emailService');
  await sendUsageLimitReached(user.email);
}
```

### Supabase Database Trigger for Welcome Emails

Create a Supabase Edge Function or Database Trigger:

```sql
-- Create function to call webhook
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://seo-saas-new-clean.vercel.app/api/send-welcome',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object('email', NEW.email)::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();
```

Then create `/api/send-welcome.js`:

```javascript
const { sendWelcomeEmail } = require('../lib/emailService');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const result = await sendWelcomeEmail(email);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
```

## Email Templates

All email templates are in `lib/emailService.js` and include:

- **Responsive design**
- **Brand colors** (#667eea, #764ba2)
- **Clear CTAs**
- **Professional styling**
- **Mobile-friendly**

## Monitoring & Analytics

### Resend Dashboard

1. View sent emails
2. Check delivery rates
3. Monitor bounces
4. Track opens/clicks
5. View API usage

### Set Up Alerts

- Daily limit warnings (approaching 100 emails/day)
- Delivery failures
- Bounce rate spikes

## Best Practices

1. **Don't overuse**: Only send necessary emails
2. **Respect frequency**: Don't spam users
3. **Test templates**: Send test emails before going live
4. **Monitor deliverability**: Check spam folder placement
5. **Add unsubscribe**: Include opt-out links (required by law)

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set in Vercel
2. Verify API key is valid in Resend dashboard
3. Check Vercel function logs for errors
4. Ensure email addresses are valid

### Emails going to spam

1. Set up SPF/DKIM records in Resend
2. Use verified sending domain
3. Avoid spam trigger words
4. Include text version of email

### Rate limit exceeded

- Free tier: 100 emails/day
- Upgrade to paid plan for higher limits
- Implement email queuing for bulk sends

## Next Steps

1. ✅ Create Resend account
2. ✅ Add `RESEND_API_KEY` to Vercel
3. ✅ Test welcome email
4. ✅ Set up Supabase trigger
5. ✅ Monitor first week of emails
6. 🔄 Set up custom sending domain (optional)
7. 🔄 Add email preferences page
8. 🔄 Implement email queue for reliability

## Cost Estimate

**Free Tier** (3,000 emails/month):
- Suitable for: 0-100 users
- Cost: $0/month

**Pro Plan** ($20/month for 50k emails):
- Suitable for: 100-1,000 users  
- Cost: $20/month

## Support

- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
- This project: See repository issues
