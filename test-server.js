const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  console.log('Sending file:', filePath);
  res.sendFile(filePath, err => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

app.listen(PORT, () => {
  console.log(`TEST server on port ${PORT}`);
});

