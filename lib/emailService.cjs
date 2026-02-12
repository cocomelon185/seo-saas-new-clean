// Email Service using Resend API
// Free tier: 3,000 emails/month, 100 emails/day

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BRAND_NAME = "RankyPulse";
const BASE_URL = process.env.APP_BASE_URL || "https://rankypulse.com";
const FROM_EMAIL = `${BRAND_NAME} <onboarding@rankypulse.com>`;

// Email templates
const templates = {
  welcome: (userData) => ({
    subject: `🎉 Welcome to ${BRAND_NAME}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚡ Welcome to ${BRAND_NAME}</h1>
        </div>
        <div style="padding: 40px; background: #f7f9fc;">
          <h2 style="color: #333;">Hi ${userData.email}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining ${BRAND_NAME}! We're excited to help you turn SEO audits into a clear, prioritized fix plan.
          </p>
          <div style="background: white; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Your Trial Includes:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>✅ Full-site SEO audit with prioritized fixes</li>
              <li>✅ Visual proof snapshots for quick decisions</li>
              <li>✅ Shareable report for clients and stakeholders</li>
              <li>✅ Clear next steps for faster rankings</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            <strong>Ready to get started?</strong> Run your first audit and see your SEO score in under 60 seconds.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}/start" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 35px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: bold;">
              Run Your First Audit
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our support page.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ${BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  firstAuditNudge: (userData) => ({
    subject: `🚀 Run your first ${BRAND_NAME} audit`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #421983; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Your first audit is waiting</h1>
        </div>
        <div style="padding: 32px; background: #f7f9fc;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hey ${userData.email}, ready to see your SEO score and fix priorities?
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Run your first audit and get a clear, prioritized fix plan with visuals and next steps.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${BASE_URL}/start"
               style="background: #7C3AED;
                      color: #fff;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 8px;
                      display: inline-block;
                      font-weight: bold;">
              Run My First Audit
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            Tip: Start with a high‑traffic page or your homepage for the fastest wins.
          </p>
        </div>
        <div style="background: #333; padding: 16px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2025 ${BRAND_NAME}. All rights reserved.</p>
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
              <a href="${BASE_URL}/pricing" 
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
          <p>© 2025 ${BRAND_NAME}. All rights reserved.</p>
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
            You've reached your monthly optimization limit on the current plan.
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
            <a href="${BASE_URL}/pricing" 
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
          <p>© 2025 ${BRAND_NAME}. All rights reserved.</p>
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
            Someone just joined ${BRAND_NAME} using your referral link!
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
            <a href="${BASE_URL}/pricing" 
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
          <p>© 2025 ${BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    `
  })
  ,
  leadNotification: (leadData) => ({
    subject: `New lead from ${leadData.brand || "RankyPulse"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">New Audit Lead</h1>
        </div>
        <div style="padding: 28px; background: #f7f9fc;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            A new lead submitted the embeddable audit form.
          </p>
          <div style="background: #fff; padding: 18px; border-radius: 10px; border: 1px solid #e6ebf1;">
            <p style="margin: 0 0 8px; color: #555;"><strong>Name:</strong> ${leadData.name || "—"}</p>
            <p style="margin: 0 0 8px; color: #555;"><strong>Email:</strong> ${leadData.email || "—"}</p>
            <p style="margin: 0 0 8px; color: #555;"><strong>URL:</strong> ${leadData.url || "—"}</p>
            <p style="margin: 0; color: #555;"><strong>Captured:</strong> ${leadData.created_at || "—"}</p>
          </div>
          ${leadData.leads_url ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${leadData.leads_url}"
                 style="background: #FF642D;
                        color: #fff;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 8px;
                        display: inline-block;
                        font-weight: bold;">
                View Lead Inbox
              </a>
            </div>
          ` : ""}
          <p style="color: #999; font-size: 13px; margin-top: 18px;">
            You can manage this lead in your RankyPulse Lead Inbox.
          </p>
        </div>
      </div>
    `
  })
  ,
  weeklyDelta: (data) => ({
    subject: `Weekly audit update for ${data.url}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Weekly SEO Delta</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color: #333; font-size: 15px;">URL: ${data.url}</p>
          <div style="background: #fff; padding: 16px; border-radius: 10px; border: 1px solid #e6ebf1;">
            <p style="margin: 0 0 8px; color: #555;"><strong>Score change:</strong> ${data.deltaScore >= 0 ? "+" : ""}${data.deltaScore} (now ${data.scoreNow})</p>
            <p style="margin: 0 0 8px; color: #555;"><strong>Fixed issues:</strong> ${data.fixed.length}</p>
            <p style="margin: 0; color: #555;"><strong>New issues:</strong> ${data.added.length}</p>
          </div>
          <div style="margin-top: 18px;">
            <h3 style="margin: 0 0 8px; color: #111;">Fixed</h3>
            ${data.fixed.length ? `<ul>${data.fixed.slice(0, 6).map((x) => `<li>${x}</li>`).join("")}</ul>` : `<p style="color:#666;">No fixes detected yet.</p>`}
          </div>
          <div style="margin-top: 12px;">
            <h3 style="margin: 0 0 8px; color: #111;">New issues</h3>
            ${data.added.length ? `<ul>${data.added.slice(0, 6).map((x) => `<li>${x}</li>`).join("")}</ul>` : `<p style="color:#666;">No new issues detected.</p>`}
          </div>
        </div>
      </div>
    `
  })
  ,
  verifyEmail: (data) => ({
    subject: "Verify your RankyPulse email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Verify your email</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color: #333; font-size: 15px;">Hi ${data.name || "there"},</p>
          <p style="color: #555; font-size: 15px;">Click the button below to verify your email and activate your account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.verifyUrl}" style="background:#FF642D;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Verify email
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">If you didn’t request this, you can ignore this email.</p>
        </div>
      </div>
    `
  }),
  resetEmail: (data) => ({
    subject: "Reset your RankyPulse password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Reset password</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color: #555; font-size: 15px;">Click below to set a new password.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.resetUrl}" style="background:#FF642D;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Reset password
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">If you didn’t request this, you can ignore this email.</p>
        </div>
      </div>
    `
  })
  ,
  teamInvite: (data) => ({
    subject: "You’ve been invited to RankyPulse",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Team invitation</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color: #555; font-size: 15px;">You’ve been invited to join the ${data.team_id} workspace as <strong>${data.role}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.inviteUrl}" style="background:#FF642D;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Accept invite
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">If you didn’t expect this, you can ignore this email.</p>
        </div>
      </div>
    `
  })
  ,
  usernameReminder: (data) => ({
    subject: "Your RankyPulse username",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Username reminder</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color:#555;font-size:15px;">Here is your sign-in username:</p>
          <div style="margin: 16px 0; padding: 14px; border-radius: 10px; background: #fff; border: 1px solid #e5d8fb;">
            <div style="font-size: 20px; font-weight: 700; color: #2B1248;">${data.username}</div>
          </div>
          <p style="color:#555;font-size:14px;">You can also sign in with your full email address.</p>
        </div>
      </div>
    `
  }),
  upgradeRequest: (data) => ({
    subject: "Upgrade request from your team",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #421983; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Upgrade request</h1>
        </div>
        <div style="padding: 24px; background: #f7f9fc;">
          <p style="color:#555;font-size:15px;">
            ${data.requester} requested a plan upgrade for team <strong>${data.team_id}</strong>.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.pricingUrl}" style="background:#FF642D;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Review pricing
            </a>
          </div>
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
  sendFirstAuditNudge: (userEmail) => sendEmail(userEmail, 'firstAuditNudge', { email: userEmail }),
  
  sendUsageWarning: (userEmail, usageData) => 
    sendEmail(userEmail, 'usageWarning', { email: userEmail, ...usageData }),
  
  sendUsageLimitReached: (userEmail) => 
    sendEmail(userEmail, 'usageLimitReached', { email: userEmail }),
  
  sendReferralNotification: (referrerEmail, referredEmail) => 
    sendEmail(referrerEmail, 'referralSuccess', { email: referrerEmail, referredEmail }),
  sendLeadNotification: (toEmail, leadData) =>
    sendEmail(toEmail, 'leadNotification', leadData),
  sendWeeklyDelta: (toEmail, data) =>
    sendEmail(toEmail, 'weeklyDelta', data),
  sendVerifyEmail: (toEmail, data) =>
    sendEmail(toEmail, 'verifyEmail', data),
  sendResetEmail: (toEmail, data) =>
    sendEmail(toEmail, 'resetEmail', data),
  sendUsernameReminder: (toEmail, data) =>
    sendEmail(toEmail, 'usernameReminder', data),
  sendTeamInviteEmail: (toEmail, data) =>
    sendEmail(toEmail, 'teamInvite', data),
  sendUpgradeRequest: (toEmail, data) =>
    sendEmail(toEmail, 'upgradeRequest', data)
};
