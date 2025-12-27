# Complete Setup Guide for ContentOptimizer AI

## Overview
This is a fully functional AI-powered SEO and content optimization SaaS platform with authentication, payments, referrals, and usage tracking.

## Features Implemented
✅ Modern landing page with authentication modals
✅ User authentication (Supabase)
✅ Dashboard with usage tracking
✅ Pricing page with payment integration (Razorpay)
✅ Referral system
✅ API endpoints for content optimization
✅ Responsive design
✅ Usage limits and subscription management

## Required Environment Variables

### For Vercel Deployment

Add these environment variables in your Vercel project settings:

```
# Supabase Configuration
SUPABASE_URL=https://dbgjlstdfgpqomzdbdel.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# OpenAI API (for content optimization)
OPENAI_API_KEY=your_openai_api_key_here

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# JWT Secret (for API authentication)
JWT_SECRET=your_random_secret_key_here

# Optional
NODE_ENV=production
ALLOWED_ORIGIN=https://your-domain.vercel.app
```

## Step 1: Supabase Database Setup

### Create These Tables in Supabase SQL Editor:

#### 1. User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_referral_code ON user_profiles(referral_code);
```

#### 2. Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free', -- free, basic, pro, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  amount DECIMAL(10,2),
  next_billing_date TIMESTAMPTZ,
  trial_ends TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

#### 3. Usage Limits Table
```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL UNIQUE, -- free, basic, pro, enterprise
  monthly_limit INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default limits
INSERT INTO usage_limits (tier, monthly_limit, description) VALUES
  ('free', 5, 'Free tier with 5 optimizations per month'),
  ('basic', 50, 'Basic tier with 50 optimizations per month'),
  ('pro', 100, 'Pro tier with 100 optimizations per month'),
  ('enterprise', 999999, 'Enterprise tier with unlimited optimizations');
```

#### 4. Usage History Table
```sql
CREATE TABLE usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- optimization, generation, analysis
  keyword TEXT,
  word_count INTEGER,
  seo_score INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_history_user_id ON usage_history(user_id);
CREATE INDEX idx_usage_history_created_at ON usage_history(created_at);
```

#### 5. Referrals Table
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  reward_amount DECIMAL(10,2) DEFAULT 10.00,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
```

#### 6. Create Trigger for User Profile
```sql
-- Create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8))
  );
  
  -- Create default free subscription
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Usage history policies
CREATE POLICY "Users can view own usage" ON usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
```

## Step 2: OpenAI API Setup

1. Go to https://platform.openai.com/
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Add it to your Vercel environment variables as `OPENAI_API_KEY`

## Step 3: Razorpay Setup

1. Go to https://razorpay.com/
2. Create an account
3. Go to Dashboard > Settings > API Keys
4. Generate Test Mode keys (for testing)
5. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Vercel environment variables
6. For production, switch to Live Mode and generate live keys

## Step 4: Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com/
3. Import your repository
4. Add all environment variables
5. Deploy!

## Step 5: Post-Deployment Configuration

### Update Supabase Settings:
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel URL to "Site URL"
3. Add your Vercel URL to "Redirect URLs"

### Update Code with Your Supabase Credentials:
Edit these files to use your actual Supabase credentials:
- `index.html` - Update SUPABASE_URL and SUPABASE_ANON_KEY
- `dashboard.html` - Update SUPABASE_URL and SUPABASE_ANON_KEY
- `pricing.html` - Update SUPABASE_URL and SUPABASE_ANON_KEY

## Features Documentation

### User Authentication
- Sign up with email/password
- Email verification
- Password reset
- Session management

### Dashboard Features
- View usage statistics
- Monthly usage tracking
- SEO score analytics
- Subscription tier display
- Content optimization tool

### Pricing & Payments
- Free tier: 5 optimizations/month
- Pro tier: 100 optimizations/month (₹999/mo)
- Enterprise tier: Unlimited (₹2999/mo)
- Razorpay integration for Indian payments
- Automatic subscription management

### Referral Program
- Unique referral code for each user
- $10 reward for referrer
- $10 discount for referred user
- Track referral statistics
- Social sharing buttons

### Content Optimization
- AI-powered content analysis
- SEO score calculation
- Keyword optimization suggestions
- Real-time feedback
- Usage tracking

## API Endpoints

### POST /api/signup
Sign up a new user
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### POST /api/signin
Sign in existing user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/optimize
Optimize content (requires authentication)
```json
{
  "keyword": "SEO optimization",
  "content": "Your content here...",
  "tone": "professional"
}
```

## Troubleshooting

### Supabase Connection Issues
- Verify your SUPABASE_URL and keys are correct
- Check if RLS policies are set up correctly
- Ensure tables exist in your database

### Payment Issues
- Verify Razorpay keys are correct
- Test with Razorpay test mode first
- Check webhook configuration

### API Issues
- Ensure OpenAI API key is valid and has credits
- Check API rate limits
- Verify authentication tokens

## Security Notes

⚠️ **IMPORTANT:**
- Never commit API keys to git
- Use environment variables for all secrets
- Enable RLS on all Supabase tables
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting

## Support

For issues or questions:
1. Check the documentation
2. Review environment variables
3. Check Supabase logs
4. Check Vercel deployment logs

## Next Steps

1. Customize the branding and colors
2. Add more payment providers
3. Implement webhook handlers
4. Add email notifications
5. Create admin dashboard
6. Add analytics integration
7. Implement team features
8. Add white-label options
