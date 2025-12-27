# Supabase Authentication Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Choose your organization
6. Set project details:
   - **Name**: seo-saas-contentoptimizer
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
7. Click "Create new project" (takes 2-3 minutes)

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Click on "Settings" (gear icon in sidebar)
2. Click on "API" in the settings menu
3. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

## Step 3: Configure Google OAuth

### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: ContentOptimizer AI
   - Support email: your email
   - Authorized domains: Add `supabase.co` and your domain
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: ContentOptimizer AI
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     (Replace YOUR_PROJECT_REF with your Supabase project reference from Step 2)
7. Copy **Client ID** and **Client Secret**

### Add Google OAuth to Supabase:

1. In Supabase Dashboard, go to "Authentication" > "Providers"
2. Find "Google" in the list
3. Toggle "Enable Sign in with Google"
4. Paste your **Client ID** and **Client Secret**
5. Click "Save"

## Step 4: Configure Email Settings

In Supabase Dashboard:

1. Go to "Authentication" > "Email Templates"
2. Customize these templates:
   - **Confirm signup**: Welcome email with verification link
   - **Reset password**: Password reset instructions
   - **Magic Link**: Passwordless login link

3. Go to "Settings" > "Auth"
4. Configure:
   - Enable Email Confirmations: ON
   - Enable Email Change Confirmations: ON
   - Minimum Password Length: 8

## Step 5: Set Up Environment Variables

### For Local Development:

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Click "Settings" > "Environment Variables"
3. Add these variables:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
     Value: Your Supabase URL
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     Value: Your anon public key
4. Click "Add" for each
5. Redeploy your application

## Step 6: Update Your Application

After you've:
1. Created your Supabase project
2. Set up Google OAuth
3. Added environment variables to Vercel

Your authentication system will be fully functional with:
- ✅ Email/password signup with verification
- ✅ Google OAuth (one-click login)
- ✅ Password reset functionality
- ✅ Secure token management
- ✅ Automatic password hashing
- ✅ Session management

## Features Included:

1. **Email Verification**: Users receive verification email after signup
2. **Password Reset**: "Forgot password?" functionality
3. **Google OAuth**: One-click sign in with Google
4. **Secure Storage**: All passwords hashed with bcrypt
5. **Session Management**: Automatic token refresh
6. **Protected Routes**: Dashboard only accessible when logged in

## Troubleshooting:

### Google OAuth not working:
- Check redirect URI matches exactly
- Ensure `supabase.co` is in authorized domains
- Verify Client ID and Secret are correct

### Email not sending:
- Check Supabase email settings
- Verify email templates are enabled
- For production, configure custom SMTP

### Users can't sign in:
- Check if email confirmation is required
- Verify Supabase URL and key in environment variables
- Clear browser cache and try again

## Next Steps:

Once setup is complete:
1. Test signup flow
2. Test Google OAuth
3. Test password reset
4. Configure custom email domain (optional)
5. Add user profile management

---

**Need help?** Check [Supabase Documentation](https://supabase.com/docs/guides/auth) or message me!
