const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();

// Serve static files from public
app.use(express.static('public'));

// Start Python backend as a subprocess
console.log('Starting Python backend...');
const pythonProcess = spawn('python3', ['main.py'], {
  stdio: 'inherit',
  detached: false
});

pythonProcess.on('error', (err) => {
  console.error('Failed to start Python process:', err);
});

// Proxy API requests to Python backend (if needed)
app.use('/api', (req, res) => {
  // Forward to Python backend running on port 5000
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: req.url,
    method: req.method
  };
  
  const proxyReq = require('http').request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('API proxy error:', err);
    res.status(500).json({ error: 'Backend unavailable' });
  });
  
  req.pipe(proxyReq);
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
