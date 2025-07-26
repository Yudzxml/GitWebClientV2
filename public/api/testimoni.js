const https = require('https');

const OWNER = 'Yudzxml';
const REPO = 'WebClientV1';
const FILE_PATH = 'testimonials.json';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;

const getFileSha = () => new Promise((resolve, reject) => {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js',
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    }
  };

  https.get(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const parsed = JSON.parse(data);
        resolve({ sha: parsed.sha, content: Buffer.from(parsed.content, 'base64').toString('utf8') });
      } else {
        reject(new Error(`GitHub API Error: ${res.statusCode}`));
      }
    });
  }).on('error', reject);
});

const updateFile = (newContent, sha) => new Promise((resolve, reject) => {
  const data = JSON.stringify({
    message: 'update testimonials',
    content: Buffer.from(newContent).toString('base64'),
    sha,
    branch: BRANCH
  });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    method: 'PUT',
    headers: {
      'User-Agent': 'Node.js',
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, res => {
    let d = '';
    res.on('data', chunk => d += chunk);
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) resolve(true);
      else reject(new Error(`GitHub update failed: ${res.statusCode}`));
    });
  });

  req.on('error', reject);
  req.write(data);
  req.end();
});

module.exports = async (req, res) => {
  // Tambahkan header CORS untuk semua request
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Tangani preflight request dari browser
  if (req.method === 'OPTIONS') {
    return res.writeHead(200).end();
  }

  if (req.method === 'GET') {
    try {
      const file = await getFileSha();
      res.setHeader('Content-Type', 'application/json');
      return res.end(file.content);
    } catch (err) {
      return res.writeHead(500).end(JSON.stringify({ error: err.message }));
    }
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const newData = JSON.parse(body);
        const file = await getFileSha();
        await updateFile(JSON.stringify(newData, null, 2), file.sha);
        res.writeHead(200).end(JSON.stringify({ message: 'Berhasil disimpan ke GitHub' }));
      } catch (err) {
        res.writeHead(500).end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(405).end('Method Not Allowed');
  }
};