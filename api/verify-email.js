const jwt = require('jsonwebtoken');
const { setVerified, getUserByEmail } = require('./auth-store');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-12345';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.email) return res.status(400).json({ error: 'Invalid token' });
    const user = getUserByEmail(payload.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = setVerified(payload.email);
    const token = jwt.sign({ email: updated.email, name: updated.name, verified: true }, JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ ok: true, email: payload.email, token });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};
