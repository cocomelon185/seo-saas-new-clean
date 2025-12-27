# Razorpay Payment Integration Setup

Complete guide for integrating Razorpay payments into ContentOptimizer AI SaaS application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Get Razorpay API Keys](#get-razorpay-api-keys)
3. [Integration Status](#integration-status)
4. [Test Integration](#test-integration)
5. [Go Live](#go-live)
6. [Webhook Setup](#webhook-setup)

## Overview

This application uses **Razorpay Standard Checkout** for payment processing. The integration follows Razorpay's official documentation:
https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

### Payment Flow

1. User clicks "Subscribe" on pricing page
2. Razorpay checkout modal opens
3. User completes payment
4. Payment verified and subscription created in Supabase
5. User redirected to dashboard

## Get Razorpay API Keys

### Step 1: Create Razorpay Account
1. Go to https://razorpay.com
2. Click "Sign Up" and complete registration
3. Verify your email and phone number

### Step 2: Get Test API Keys
1. Log in to Razorpay Dashboard
2. Ensure you're in **Test Mode** (top left)
3. Navigate to: **Settings** → **API Keys**
4. Click **Generate Test Keys**
5. You'll get:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this secure, never expose in frontend)

### Step 3: Update pricing.html

1. Open `pricing.html`
2. Find line 123: `const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID'`
3. Replace `YOUR_RAZORPAY_KEY_ID` with your actual Test Key ID
4. Save and commit the file

## Integration Status

### ✅ Completed

- [x] Razorpay SDK loaded via CDN
- [x] Pricing page created with 3 tiers (Free, Pro, Enterprise)
- [x] Payment checkout integration
- [x] Supabase authentication integration
- [x] Free trial functionality
- [x] Payment success handler
- [x] Subscription data storage logic
- [x] Landing page buttons linked to pricing

### ⚠️ Requires Configuration

- [ ] Add your Razorpay Test Key ID in `pricing.html` (line 123)
- [ ] Create Supabase `subscriptions` table (SQL below)
- [ ] Test payment flow
- [ ] Add webhook handling (for production)

## Test Integration

### Prerequisites

1. **Razorpay Test Key ID added** to `pricing.html`
2. **Supabase subscriptions table created** (see SQL below)
3. **User account created** via Sign Up

### Create Subscriptions Table

Run this in Supabase SQL Editor:

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER,
  trial_ends TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Test Cards (from Razorpay Docs)

Use these test cards in **Test Mode** only:

| Card Network | Card Number | CVV | Expiry |
|--------------|-------------|-----|--------|
| Visa | 4111 1111 1111 1111 | Any 3 digits | Any future date (MM/YY) |
| Mastercard | 5555 5555 5555 4444 | Any 3 digits | Any future date |
| Visa | 4384 7968 2770 3274 | Any 3 digits | Any future date |
| Mastercard | 5312 6865 5677 9641 | Any 3 digits | Any future date |

### Testing Steps

1. **Open your site**: https://seo-saas-new-clean.vercel.app

2. **Sign Up/Sign In**: Click "Sign In" or "Get Started"

3. **Go to Pricing**: Click "Get Started" or "Start Free Trial"

4. **Test Free Trial**:
   - Click "Start Free Trial" on Free plan
   - Should create free subscription and redirect to dashboard

5. **Test Paid Subscription**:
   - Click "Subscribe Now" on Pro (₹999) or Enterprise (₹2999)
   - Razorpay checkout modal should open
   - Use test card: **4111 1111 1111 1111**
   - CVV: Any 3 digits (e.g., 123)
   - Expiry: Any future date (e.g., 12/25)
   - Click "Pay ₹999" or "Pay ₹2999"

6. **Verify Success**:
   - You should see "Subscription successful!" alert
   - Browser redirects to dashboard
   - Check Razorpay Dashboard → Payments for transaction
   - Check Supabase → subscriptions table for record

### Expected Behavior

**✅ Success Case**:
- Payment completes
- Alert: "Subscription successful!"
- Subscription record created in Supabase
- User redirected to `dashboard.html`
- Payment visible in Razorpay Dashboard

**❌ Failure Case**:
- Payment fails (use wrong CVV or cancel)
- User stays on checkout
- No subscription created
- Can retry payment

## Go Live

Once testing is successful, switch to Live Mode:

### Step 1: Generate Live API Keys

1. Log in to Razorpay Dashboard
2. Switch to **Live Mode** (top left toggle)
3. Navigate to: **Settings** → **API Keys** 
4. Click **Generate Live Keys**
5. Download and save securely

### Step 2: Update Code

1. Open `pricing.html`
2. Replace Test Key ID with **Live Key ID** (starts with `rzp_live_`)
3. Commit and deploy

### Step 3: Enable Auto-Capture

1. In Razorpay Dashboard → **Settings** → **Payment Capture**
2. Enable **Auto-capture payments**
3. Set capture time (recommended: Immediate)

## Webhook Setup

### Why Webhooks?

Webhooks notify your server of payment events (success, failure, refunds) asynchronously. **Recommended for production**.

### Setup Steps

1. **Create Webhook Endpoint** (backend required)
   - You'll need a server endpoint to receive webhooks
   - Example: `https://your-domain.com/api/razorpay-webhook`

2. **Configure in Razorpay Dashboard**:
   - Go to: **Settings** → **Webhooks**
   - Click **Create New Webhook**
   - URL: Your webhook endpoint
   - Events to subscribe:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `subscription.charged`
     - `subscription.cancelled`

3. **Verify Webhook Signature** (security critical)
   ```javascript
   const crypto = require('crypto');
   const webhookSecret = 'YOUR_WEBHOOK_SECRET';
   
   const signature = req.headers['x-razorpay-signature'];
   const body = JSON.stringify(req.body);
   
   const expectedSignature = crypto
     .createHmac('sha256', webhookSecret)
     .update(body)
     .digest('hex');
   
   if (signature === expectedSignature) {
     // Webhook is authentic, process event
   }
   ```

## Important Security Notes

🔒 **DO NOT** expose your Key Secret in frontend code
🔒 **DO** verify payment signatures server-side
🔒 **DO** use HTTPS in production
🔒 **DO** validate webhook signatures
🔒 **DO** store keys in environment variables, not in code

## Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0/month | 5 optimizations, Basic SEO, Email support |
| **Pro** | ₹999/month | 100 optimizations, AI generation, Priority support |
| **Enterprise** | ₹2999/month | Unlimited, Team collaboration, 24/7 support, API access |

## Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Support**: https://razorpay.com/support/
- **Integration Guide**: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

## Troubleshooting

### Issue: "The id provided does not exist"
**Cause**: API key mismatch  
**Solution**: Ensure Test/Live mode matches between Dashboard and code

### Issue: Payment not captured
**Cause**: Auto-capture disabled  
**Solution**: Enable auto-capture in Dashboard settings

### Issue: "Blocked by CORS policy"
**Cause**: API call from frontend  
**Solution**: Move Order creation to backend server

### Issue: Checkout doesn't open
**Cause**: Key ID not set or incorrect  
**Solution**: Verify key ID in `pricing.html` line 123

---

**Last Updated**: December 26, 2025  
**Integration Version**: Razorpay Standard Checkout v1  
**Status**: Ready for Testing ✅
