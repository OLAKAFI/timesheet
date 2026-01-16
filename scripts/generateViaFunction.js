// Call Cloud Function to generate code
const https = require('https');

function generateViaFunction() {
  const data = JSON.stringify({});
  
  const options = {
    hostname: 'your-project-id.cloudfunctions.net',
    path: '/generateInviteCode',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer YOUR_SECRET_TOKEN'
    }
  };
  
  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      const result = JSON.parse(responseData);
      if (result.success) {
        console.log('✅ Code generated:', result.code);
        console.log('Expires:', new Date(result.expiresAt).toLocaleDateString());
      } else {
        console.error('❌ Error:', result.error);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request failed:', error);
  });
  
  req.write(data);
  req.end();
}

generateViaFunction();