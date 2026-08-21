const http = require('http');

const endpoints = [
  { name: 'Notices API', url: 'http://localhost:8080/api/v1/notices' },
  { name: 'Students API', url: 'http://localhost:8080/api/v1/students' },
  { name: 'Frontend Load (HTML)', url: 'http://localhost:3000/' }
];

async function measureTime(url) {
  const start = Date.now();
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({ status: res.statusCode, duration, bytes: data.length });
      });
    }).on('error', (err) => {
      const duration = Date.now() - start;
      resolve({ status: 'ERROR', error: err.message, duration });
    });
  });
}

async function run() {
  console.log('--- Baseline Metrics ---');
  for (const ep of endpoints) {
    try {
      const result = await measureTime(ep.url);
      console.log(`${ep.name}: ${result.duration}ms (Status: ${result.status}, Bytes: ${result.bytes || 0})`);
    } catch(e) {
      console.log(`${ep.name}: Failed to measure`);
    }
  }
}

run();
