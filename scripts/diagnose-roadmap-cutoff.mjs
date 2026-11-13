import http from 'http';

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', reject);
  });
}

async function main() {
  try {
    const status = await checkUrl('http://127.0.0.1:3329/play-demo.html');
    console.log('Server 3329 status:', status);
  } catch (e) {
    console.error('Server 3329 error:', e.message);
  }
}
main();
