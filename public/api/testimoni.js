const OWNER = 'Yudzxml';
const REPO = 'WebClientV1';
const FILE_PATH = 'testimonials.json';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;

const GITHUB_API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

const getFileSha = async () => {
  const url = `${GITHUB_API}?ref=${BRANCH}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js',
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub API Error: ${res.status}`);
  }

  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, 'base64').toString('utf8')
  };
};

const updateFile = async (newContent, sha) => {
  const res = await fetch(GITHUB_API, {
    method: 'PUT',
    headers: {
      'User-Agent': 'Node.js',
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'update testimonials',
      content: Buffer.from(newContent).toString('base64'),
      sha,
      branch: BRANCH
    })
  });

  if (!res.ok) {
    throw new Error(`GitHub update failed: ${res.status}`);
  }

  return true;
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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