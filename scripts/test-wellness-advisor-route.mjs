import http from 'http';

async function testRoute() {
  const payload = JSON.stringify({
    requestId: "a819b52c-47bc-4934-92e9-4e7cb8be9a91",
    questId: "healthclues-realm",
    locale: "vi",
    forceRefresh: true,
    profile: {
      topic: "Đường huyết",
      contentPreferences: [],
      safetyLevel: "none",
      specificInterests: ["blood-sugar"],
      safetyContext: {}
    }
  });

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Origin': 'https://www.botly.vn',
    'x-request-id': 'a819b52c-47bc-4934-92e9-4e7cb8be9a91'
  };

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3329,
    path: '/api/healthclues/wellness-advisor',
    method: 'POST',
    headers
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log('Response Status:', json.status);
        console.log('Goals count:', json.goals?.length);
        if (json.goals) {
          json.goals.forEach((g, i) => {
            console.log(`  Goal ${i+1}: ${g.title.vi} (${g.category}) - proof: ${Boolean(g.advisorProof)}`);
          });
        }
        if (json.error) console.log('Error:', json.error);
      } catch (e) {
        console.log('Raw data:', data.slice(0, 300));
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.write(payload);
  req.end();
}

testRoute();
