// ===========================
// CONFIGURASI GITHUB
// ===========================
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
if (!GITHUB_TOKEN) {
  console.warn(
    '⚠️  GitHub Token tidak ditemukan di process.env.GITHUB_TOKEN. ' +
    'Pastikan Anda sudah set environment variable-nya sebelum menjalankan aplikasi.'
  );
}
const REPO_OWNER = 'Yudzxml';
const REPO_NAME = 'WebClientV1';
const BRANCH     = 'main';
const FILE_PATH  = 'products.json';

const githubHeaders = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

// ===========================
//  GET SHA JSON 
// ===========================
async function getFileMetadata() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`;
  console.log(`📡 getFileMetadata: GET ${url}`);
  
  const response = await fetch(url, { headers: githubHeaders });
  if (!response.ok) {
    throw new Error(`Gagal mendapatkan metadata: ${response.status} ${response.statusText}`);
  }

  const meta = await response.json();
  console.log('📡 getFileMetadata: metadata diperoleh, SHA =', meta.sha);
  return meta; // { sha, content (base64), ... }
}
// ===========================
// 1. GET ALL PRODUK
// ===========================
async function fetchAllProducts() {
  try {
    console.log('▶️ fetchAllProducts: mulai mengambil file products.json');
    const meta = await getFileMetadata();
    const contentBase64 = meta.content;
    const decoded = atob(contentBase64);
    const products = JSON.parse(decoded);
    console.log('▶️ fetchAllProducts: data produk parsed, jumlah =', products.length);
    return { products, sha: meta.sha };
  } catch (error) {
    console.error('❌ fetchAllProducts: Error saat fetch:', error);
    return { products: [], sha: null };
  }
}
// ===========================
// 2. UPDATE PRODUK
// ===========================
async function updateAllProducts(newProductsArray, currentSha) {
  try {
    console.log('▶️ updateAllProducts: mulai meng-update products.json');
    const prettyJson   = JSON.stringify(newProductsArray, null, 2);
    const newContent   = btoa(prettyJson);
    const url          = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const body         = {
      message: 'Update products.json via API',
      content: newContent,
      sha: currentSha,
      branch: BRANCH,
    };

    console.log(`📡 updateAllProducts: PUT ${url} (SHA saat ini: ${currentSha})`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...githubHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gagal update file: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ updateAllProducts: sukses, commit baru:', result.commit.sha);
    return result;
  } catch (error) {
    console.error('❌ updateAllProducts: Error saat update:', error);
    throw error;
  }
}
// ===========================
// 3. TAMBAH PRODUK
// ===========================
async function addProduct(newProductObj) {
  console.log('➕ addProduct: akan menambah produk baru:', newProductObj);
  const { products, sha } = await fetchAllProducts();

  if (sha === null) {
    throw new Error('Tidak bisa addProduct karena SHA file tidak diperoleh.');
  }

  newProductObj.id = Date.now().toString();
  products.push(newProductObj);
  console.log(`➕ addProduct: produk ditambahkan ke array, total sekarang = ${products.length}`);

  const updateResult = await updateAllProducts(products, sha);
  return updateResult;
}

// ===========================
// 4. EDIT PRODUK
// ===========================
async function editProductById(productId, updatedProductObj) {
  console.log(`✏️ editProductById: mengedit produk ID = ${productId}`);
  const { products, sha } = await fetchAllProducts();

  if (sha === null) {
    throw new Error('Tidak bisa editProduct karena SHA file tidak diperoleh.');
  }

  const idx = products.findIndex((p) => p.id === productId);
  if (idx === -1) {
    throw new Error('Produk tidak ditemukan untuk di-edit.');
  }

  updatedProductObj.id = productId; // Pastikan ID tetap sama
  products[idx] = updatedProductObj;
  console.log(`✏️ editProductById: produk di-index ${idx} di-update =>`, updatedProductObj);

  const updateResult = await updateAllProducts(products, sha);
  return updateResult;
}

// ===========================
// 5. HAPUS PRODUK
// ===========================
async function deleteProductById(productId) {
  console.log(`🗑️ deleteProductById: menghapus produk ID = ${productId}`);
  const { products, sha } = await fetchAllProducts();

  if (sha === null) {
    throw new Error('Tidak bisa deleteProduct karena SHA file tidak diperoleh.');
  }

  const filtered = products.filter((p) => p.id !== productId);
  if (filtered.length === products.length) {
    throw new Error('Produk untuk dihapus tidak ditemukan.');
  }

  console.log(`🗑️ deleteProductById: produk terhapus, total sekarang = ${filtered.length}`);
  const updateResult = await updateAllProducts(filtered, sha);
  return updateResult;
}