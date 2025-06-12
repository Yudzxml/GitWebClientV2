const { randomUUID } = require('crypto');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'Yudzxml';
const REPO = 'WebClientV1';
const FILE_PATH = 'comments.json';
const BRANCH = 'main';
const GITHUB_API_BASE = 'https://api.github.com';

if (!GITHUB_TOKEN || !OWNER || !REPO) {
  throw new Error(
    'Pastikan environment variables GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO sudah ter-set.'
  );
}

async function getFileContent() {
  const url = `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  });
  if (res.status === 404) return { data: [], sha: null };
  if (!res.ok) throw new Error(`GET file failed: ${res.status} ${await res.text()}`);

  // Ambil metadata untuk SHA
  const metaRes = await fetch(url.replace('?ref=' + BRANCH, ''), {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!metaRes.ok) throw new Error(`GET metadata failed: ${metaRes.status} ${await metaRes.text()}`);
  const { sha } = await metaRes.json();

  const textContent = await res.text();
  let data;
  try {
    data = JSON.parse(textContent);
  } catch {
    data = [];
  }
  return { data, sha };
}

async function updateFile(newContent, sha) {
  const url = `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const encoded = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');
  const body = {
    message: `Update komentar: ${new Date().toISOString()}`,
    content: encoded,
    sha,
    branch: BRANCH,
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT file failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Handler untuk Vercel (CommonJS)
module.exports = async function handler(req, res) {
  // di Next.js/Vercel, id ada di req.query.id jika file bernama [...id].js
  const idParam = req.query?.id || null;

  if (req.method === 'GET') {
    try {
      const { data } = await getFileContent();
      return res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, text, rating } = req.body;
      if (!username || !text || rating == null) {
        return res.status(400).json({ error: 'username, text, dan rating wajib diisi.' });
      }
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'rating harus angka antara 1 sampai 5.' });
      }

      const timestamp = new Date().toISOString();
      const newComment = {
        id: randomUUID(),
        username,
        text,
        rating,
        created_at: timestamp,
      };

      const { data: existing, sha } = await getFileContent();
      const arr = Array.isArray(existing) ? existing : [];
      arr.push(newComment);
      await updateFile(arr, sha);

      return res.status(201).json(newComment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE' && idParam) {
    try {
      const { data: existing, sha } = await getFileContent();
      const arr = Array.isArray(existing) ? existing : [];
      const newArr = arr.filter(c => c.id !== idParam);

      if (newArr.length === arr.length) {
        return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
      }

      await updateFile(newArr, sha);
      return res.status(204).end();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).end('Method Not Allowed');
};