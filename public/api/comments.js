const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'Yudzxml';
const REPO = 'WebClientV1';
const FILE_PATH = "comments.json";
const BRANCH = "main";

if (!GITHUB_TOKEN || !OWNER || !REPO) {
  throw new Error("Pastikan environment variables GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO sudah ter-set.");
}

const GITHUB_API_BASE = "https://api.github.com";

async function getFileContent() {
  const url = `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3.raw"
    }
  });
  if (res.status === 404) {
    return { data: [], sha: null };
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error saat GET file: ${res.status} - ${text}`);
  }

  // Ambil metadata (termasuk SHA) untuk commit/update
  const metaRes = await fetch(url.replace(`&ref=${BRANCH}`, ""), {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Error saat GET metadata file: ${metaRes.status} - ${errText}`);
  }
  const metaJson = await metaRes.json();
  const sha = metaJson.sha;

  const textContent = await res.text();
  let data;
  try {
    data = JSON.parse(textContent);
  } catch (e) {
    data = [];
  }
  return { data, sha };
}

async function updateFile(newContent, sha) {
  const url = `${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const encoded = Buffer.from(JSON.stringify(newContent, null, 2)).toString("base64");
  const body = {
    message: `Update komentar: ${new Date().toISOString()}`,
    content: encoded,
    sha: sha,
    branch: BRANCH
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error saat PUT file: ${res.status} - ${text}`);
  }
  return await res.json();
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { data } = await getFileContent();
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    let bodyData = "";
    req.on("data", (chunk) => {
      bodyData += chunk;
    });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyData);
        const { username, text, rating } = payload;
        if (!username || !text || rating == null) {
          return res.status(400).json({ error: "username, text, dan rating wajib diisi." });
        }
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
          return res.status(400).json({ error: "rating harus angka antara 1 sampai 5." });
        }

        const timestamp = new Date().toISOString();
        const newComment = {
          username: username,
          text: text,
          rating: rating,
          created_at: timestamp
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
    });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end("Method Not Allowed");
};