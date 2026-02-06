const jwt = require('jsonwebtoken');
const { getUserByEmail } = require('./auth-store');
const { sendResetEmail, sendVerifyEmail } = require('../lib/emailService.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-12345';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, verifyOnly } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (verifyOnly) {
      const verifyToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2d' });
      const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(verifyToken)}`;
      try {
        await sendVerifyEmail(email, { verifyUrl });
      } catch {}
      return res.status(200).json({ ok: true });
    }
    const resetToken = jwt.sign({ email, action: 'reset' }, JWT_SECRET, { expiresIn: '2h' });
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/auth/reset?token=${encodeURIComponent(resetToken)}`;
    try {
      await sendResetEmail(email, { resetUrl });
    } catch {}
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reset token' });
  }
};
