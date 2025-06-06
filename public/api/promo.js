// File: api/promo.js
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER        = 'Yudzxml';
const REPO         = 'WebClientV1';
const BRANCH       = 'main';
const FILE_PATH    = 'promo.json';

const CONTENT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
const RAW_URL     = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${FILE_PATH}`;

module.exports = async (req, res) => {
  // Helper: fetch current promo.json and its SHA
  async function fetchCurrentFile() {
    const shaResponse = await fetch(CONTENT_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    if (!shaResponse.ok) {
      const err = await shaResponse.text();
      throw new Error(`Gagal mengambil SHA promo.json: ${shaResponse.status} ${err}`);
    }
    const shaData = await shaResponse.json();
    const fileSha = shaData.sha;

    const rawResponse = await fetch(RAW_URL);
    if (!rawResponse.ok) {
      const err = await rawResponse.text();
      throw new Error(`Gagal mengambil isi promo.json: ${rawResponse.status} ${err}`);
    }
    const promos = await rawResponse.json();
    return { fileSha, promos };
  }

  // Helper: commit an updated array back to GitHub
  async function commitUpdatedArray(updatedArray, currentSha) {
    const base64Content = Buffer.from(JSON.stringify(updatedArray, null, 2)).toString('base64');
    const payload = {
      message: 'Update promo.json via /api/promo',
      content: base64Content,
      sha: currentSha,
      branch: BRANCH
    };

    const putResponse = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(payload)
    });

    if (!putResponse.ok) {
      const err = await putResponse.text();
      throw new Error(`Gagal menyimpan promo.json: ${putResponse.status} ${err}`);
    }
    const data = await putResponse.json();
    return data.content.sha; // return new SHA
  }

  try {
    // Pertama, fetch current promos + SHA
    const { fileSha, promos } = await fetchCurrentFile();
    const method = req.method.toUpperCase();

    // ------ GET ------
    if (method === 'GET') {
      return res.status(200).json(promos);
    }

    // ------ POST (Tambah promo baru) ------
    else if (method === 'POST') {
      const {
        nama,
        deskripsi,
        harga_awal,
        harga_promo,
        berlaku_sampai,
        wa_nomor
      } = req.body;

      if (!nama || !deskripsi || !harga_awal || !harga_promo || !berlaku_sampai || !wa_nomor) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
      }

      // Tentukan ID baru (incremental)
      const maxId = promos.reduce((max, p) => (p.id > max ? p.id : max), 0);
      const newPromo = {
        id: maxId + 1,
        nama,
        deskripsi,
        harga_awal: Number(harga_awal),
        harga_promo: Number(harga_promo),
        berlaku_sampai,
        wa_nomor
      };

      const updatedArray = [newPromo, ...promos];
      const newSha = await commitUpdatedArray(updatedArray, fileSha);
      return res.status(201).json({ promos: updatedArray, newSha });
    }

    // ------ PUT (Edit promo berdasarkan ID) ------
    else if (method === 'PUT') {
      const {
        id,
        nama,
        deskripsi,
        harga_awal,
        harga_promo,
        berlaku_sampai,
        wa_nomor
      } = req.body;

      if (
        typeof id !== 'number' ||
        !nama ||
        !deskripsi ||
        !harga_awal ||
        !harga_promo ||
        !berlaku_sampai ||
        !wa_nomor
      ) {
        return res.status(400).json({
          error:
            'Field id, nama, deskripsi, harga_awal, harga_promo, berlaku_sampai, wa_nomor wajib diisi'
        });
      }

      const idx = promos.findIndex((p) => p.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: `Promo dengan id ${id} tidak ditemukan` });
      }

      const updatedPromo = {
        id,
        nama,
        deskripsi,
        harga_awal: Number(harga_awal),
        harga_promo: Number(harga_promo),
        berlaku_sampai,
        wa_nomor
      };
      const updatedArray = promos.map((p) => (p.id === id ? updatedPromo : p));
      const newSha = await commitUpdatedArray(updatedArray, fileSha);
      return res.status(200).json({ promos: updatedArray, newSha });
    }

    // ------ DELETE (Hapus promo berdasarkan ?id=) ------
    else if (method === 'DELETE') {
      const query = req.query || {};
      const idToDelete = Number(query.id);
      if (isNaN(idToDelete)) {
        return res.status(400).json({ error: 'Query parameter id harus berupa angka' });
      }

      const exists = promos.some((p) => p.id === idToDelete);
      if (!exists) {
        return res.status(404).json({ error: `Promo dengan id ${idToDelete} tidak ditemukan` });
      }

      const updatedArray = promos.filter((p) => p.id !== idToDelete);
      const newSha = await commitUpdatedArray(updatedArray, fileSha);
      return res.status(200).json({ promos: updatedArray, newSha });
    }

    // ------ METHOD lain (tidak diizinkan) ------
    else {
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ error: `Method ${req.method} tidak diizinkan` });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};