// Helper function to parse request body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
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
    
    req.on('error', reject);
  });
}

module.exports = { parseBody };
