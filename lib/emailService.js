// Email Service using Resend API
// Free tier: 3,000 emails/month, 100 emails/day

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ContentOptimizer AI <onboarding@seo-saas-new-clean.vercel.app>';

// Email templates
const templates = {
  welcome: (userData) => ({
    subject: '🎉 Welcome to ContentOptimizer AI!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚡ Welcome to ContentOptimizer AI</h1>
        </div>
        <div style="padding: 40px; background: #f7f9fc;">
          <h2 style="color: #333;">Hi ${userData.email}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining ContentOptimizer AI! We're excited to help you boost your SEO rankings with AI-powered content optimization.
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Your Free Plan Includes:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>✅ 10 content optimizations per month</li>
              <li>✅ Basic SEO analysis</li>
              <li>✅ Keyword recommendations</li>
              <li>✅ Content scoring</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            <strong>Ready to get started?</strong> Head to your dashboard and optimize your first piece of content!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://seo-saas-new-clean.vercel.app/dashboard.html" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 35px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our support page.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ContentOptimizer AI. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  usageWarning: (userData, usage) => ({
    subject: `⚠️ You're at ${usage.percentage}% of your monthly limit`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #fff3cd; padding: 30px; text-align: center; border-bottom: 4px solid #ffc107;">
          <h1 style="color: #856404; margin: 0;">⚠️ Usage Alert</h1>
        </div>
        <div style="padding: 40px; background: #f7f9fc;">
          <h2 style="color: #333;">Hi ${userData.email}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've used <strong>${usage.used} out of ${usage.limit}</strong> optimizations this month (${usage.percentage}%).
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">What happens next?</h3>
            <p style="color: #666; line-height: 1.6;">
              You have <strong>${usage.remaining} optimizations remaining</strong> for this month. 
              ${usage.percentage >= 90 ? 'Consider upgrading to Pro for unlimited optimizations!' : 'Make the most of your remaining credits!'}
            </p>
          </div>
          ${usage.percentage >= 80 ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://seo-saas-new-clean.vercel.app/pricing.html" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 35px;
                        text-decoration: none;
                        border-radius: 8px;
                        display: inline-block;
                        font-weight: bold;">
                Upgrade to Pro
              </a>
            </div>
          ` : ''}
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Your usage resets on the 1st of each month.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ContentOptimizer AI. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  usageLimitReached: (userData) => ({
    subject: '🚫 Monthly Limit Reached',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8d7da; padding: 30px; text-align: center; border-bottom: 4px solid #f44336;">
          <h1 style="color: #721c24; margin: 0;">🚫 Limit Reached</h1>
        </div>
        <div style="padding: 40px; background: #f7f9fc;">
          <h2 style="color: #333;">Hi ${userData.email}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You've reached your monthly optimization limit on the Free plan.
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f44336;">
            <h3 style="color: #721c24; margin-top: 0;">Want to keep optimizing?</h3>
            <p style="color: #666; line-height: 1.6;">
              Upgrade to Pro and get:
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>✨ 100 optimizations per month</li>
              <li>✨ Advanced SEO analysis</li>
              <li>✨ Priority support</li>
              <li>✨ Export reports</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://seo-saas-new-clean.vercel.app/pricing.html" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 35px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: bold;">
              Upgrade Now
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Or wait until next month when your usage resets!
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ContentOptimizer AI. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  referralSuccess: (userData, referredEmail) => ({
    subject: '🎉 Someone joined using your referral!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 Referral Success!</h1>
        </div>
        <div style="padding: 40px; background: #f7f9fc;">
          <h2 style="color: #333;">Great news, ${userData.email}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Someone just joined ContentOptimizer AI using your referral link!
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="color: #666; line-height: 1.6;">
              <strong>Referred user:</strong> ${referredEmail}<br>
              <strong>Your reward:</strong> +5 bonus optimizations added to your account!
            </p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Keep sharing your referral link to earn more optimizations!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://seo-saas-new-clean.vercel.app/referral.html" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 35px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: bold;">
              View Referrals
            </a>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ContentOptimizer AI. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, template, data) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const emailContent = templates[template](data);
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
module.exports = {
  sendWelcomeEmail: (userEmail) => sendEmail(userEmail, 'welcome', { email: userEmail }),
  
  sendUsageWarning: (userEmail, usageData) => 
    sendEmail(userEmail, 'usageWarning', { email: userEmail, ...usageData }),
  
  sendUsageLimitReached: (userEmail) => 
    sendEmail(userEmail, 'usageLimitReached', { email: userEmail }),
  
  sendReferralNotification: (referrerEmail, referredEmail) => 
    sendEmail(referrerEmail, 'referralSuccess', { email: referrerEmail, referredEmail })
};
