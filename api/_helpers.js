// Helper function to parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let hasResolved = false;
    
    req.on('data', chunk => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      if (hasResolved) return;
      hasResolved = true;
      
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        // Try to parse as JSON
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve({});
        }
      } catch (error) {
        // If not JSON, return empty object
        resolve({});
      }
    });
    
    req.on('error', (error) => {
      if (hasResolved) return;
      hasResolved = true;
      reject(error);
    });
  });
}

module.exports = { parseBody };
