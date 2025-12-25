const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-12345';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const token = jwt.sign({ email, name: email.split('@')[0] }, JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ success: true, token, user: { email, name: email.split('@')[0] } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign in' });
  }
};
