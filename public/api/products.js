const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
if (!GITHUB_TOKEN) {
  console.warn('⚠️ GitHub Token tidak ditemukan di environment variables!');
}

const REPO_OWNER = 'Yudzxml';
const REPO_NAME = 'WebClientV1';
const BRANCH = 'main';
const FILE_PATH = 'products.json';

const githubHeaders = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

const atob = (str) => Buffer.from(str, 'base64').toString('utf8');
const btoa = (str) => Buffer.from(str, 'utf8').toString('base64');

async function getFileMetadata() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: githubHeaders });
  if (!res.ok) throw new Error(`Gagal mendapatkan metadata: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function fetchAllProducts() {
  const meta = await getFileMetadata();
  const decoded = atob(meta.content);
  const products = JSON.parse(decoded);
  return { products, sha: meta.sha };
}

async function updateAllProducts(newProductsArray, currentSha) {
  const prettyJson = JSON.stringify(newProductsArray, null, 2);
  const newContent = btoa(prettyJson);

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const body = {
    message: 'Update products.json via API',
    content: newContent,
    sha: currentSha,
    branch: BRANCH,
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...githubHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gagal update file: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function addProduct(newProductObj) {
  const { products, sha } = await fetchAllProducts();
  if (!sha) throw new Error('SHA file tidak diperoleh.');
  newProductObj.id = Date.now().toString();
  products.push(newProductObj);
  return await updateAllProducts(products, sha);
}

async function editProductById(productId, updatedProductObj) {
  const { products, sha } = await fetchAllProducts();
  if (!sha) throw new Error('SHA file tidak diperoleh.');
  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) throw new Error('Produk tidak ditemukan.');
  updatedProductObj.id = productId;
  products[idx] = updatedProductObj;
  return await updateAllProducts(products, sha);
}

async function deleteProductById(productId) {
  const { products, sha } = await fetchAllProducts();
  if (!sha) throw new Error('SHA file tidak diperoleh.');
  const filtered = products.filter((p) => p.id !== productId);
  if (filtered.length === products.length) throw new Error('Produk untuk dihapus tidak ditemukan.');
  return await updateAllProducts(filtered, sha);
}

module.exports = async function handler(req, res) {
  try {
    const method = req.method.toUpperCase();

    if (method === 'GET') {
      const { products } = await fetchAllProducts();
      return res.status(200).json(products);
    }

    if (method === 'POST') {
      const newProduct = req.body;
      if (!newProduct || typeof newProduct !== 'object') {
        return res.status(400).json({ error: 'Data produk tidak valid.' });
      }
      const result = await addProduct(newProduct);
      return res.status(201).json({ message: 'Produk ditambahkan', commit: result.commit.sha });
    }

    if (method === 'PUT') {
      const { id, ...updatedProduct } = req.body;
      if (!id || Object.keys(updatedProduct).length === 0) {
        return res.status(400).json({ error: 'ID produk dan data update wajib diisi.' });
      }
      const result = await editProductById(id, updatedProduct);
      return res.status(200).json({ message: 'Produk diupdate', commit: result.commit.sha });
    }

    if (method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID produk wajib diisi untuk delete.' });
      }
      const result = await deleteProductById(id);
      return res.status(200).json({ message: 'Produk dihapus', commit: result.commit.sha });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} tidak diizinkan` });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}