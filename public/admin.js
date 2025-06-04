// Hardcoded admin credential
const ADMIN_EMAIL = 'yudzxml@gmail.com';
const ADMIN_PASSWORD = '@Yudzxml1122';

// Elemen dari HTML
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const adminSection = document.getElementById('admin-section');
const productForm = document.getElementById('product-form');
const productsTableBody = document.getElementById('product-list');

let products = [];
let editingProductId = null;

// GitHub info
const GITHUB_REPO = 'Yudzxml/WebClientV1';
const GITHUB_BRANCH = 'main';
const GITHUB_FILE_PATH = 'products.json';
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE'; // Ganti token GitHub kamu

// Cek session login
function checkLogin() {
  const loggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
  console.log('[checkLogin] Status login:', loggedIn);
  document.getElementById('login-container').style.display = loggedIn ? 'none' : 'block';
  adminSection.style.display = loggedIn ? 'block' : 'none';

  if (loggedIn) {
    console.log('[checkLogin] Memuat produk...');
    loadProducts();
  }
}

// Login handler
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  console.log('[Login] Email:', email);

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    console.log('[Login] Berhasil login sebagai admin');
    checkLogin();
  } else {
    console.warn('[Login] Gagal login: email atau password salah');
    alert('Email atau password salah!');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  console.log('[Logout] Logout admin');
  sessionStorage.removeItem('adminLoggedIn');
  location.reload();
});

// Ambil SHA file JSON dari GitHub
async function fetchFileSHA() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
  console.log('[fetchFileSHA] URL:', url);

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    }
  });

  if (!res.ok) {
    console.error('[fetchFileSHA] Gagal fetch SHA');
    throw new Error('Gagal ambil file SHA');
  }

  const data = await res.json();
  console.log('[fetchFileSHA] SHA:', data.sha);
  return data.sha;
}

// Load produk dari GitHub
async function loadProducts() {
  try {
    console.log('[loadProducts] Mengambil produk dari GitHub...');
    const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_FILE_PATH}`);
    if (!res.ok) throw new Error('Gagal load produk');
    products = await res.json();
    console.log('[loadProducts] Produk berhasil dimuat:', products);
    renderTable();
  } catch (e) {
    console.error('[loadProducts] Error:', e);
    alert('Error load produk: ' + e.message);
  }
}

// Tampilkan tabel produk
function renderTable() {
  console.log('[renderTable] Menampilkan produk...');
  productsTableBody.innerHTML = '';
  products.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image}" alt="${p.name}" style="width:50px; border-radius:4px;" /></td>
      <td>${p.name}</td>
      <td>Rp${p.price.toLocaleString()}</td>
      <td>${p.description}</td>
      <td>
        <button onclick="editProduct(${i})">Edit</button>
        <button onclick="deleteProduct(${i})" style="background:#d63e1f;">Hapus</button>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });
}

// Submit form produk (tambah/edit)
productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('prod-name').value.trim();
  const price = parseInt(document.getElementById('prod-price').value);
  const image = document.getElementById('prod-image').value.trim();
  const description = document.getElementById('prod-desc').value.trim();

  if (!name || !description || !price || !image) {
    console.warn('[productForm] Validasi gagal');
    alert('Semua field wajib diisi!');
    return;
  }

  const newProduct = { name, price, image, description };
  console.log(`[productForm] ${editingProductId !== null ? 'Edit' : 'Tambah'} produk:`, newProduct);

  if (editingProductId !== null) {
    products[editingProductId] = newProduct;
  } else {
    products.push(newProduct);
  }

  try {
    await saveProductsToGitHub(products);
    alert('Produk berhasil disimpan');
    resetForm();
    renderTable();
  } catch (err) {
    console.error('[productForm] Gagal simpan:', err);
    alert('Gagal menyimpan produk: ' + err.message);
  }
});

// Edit produk
window.editProduct = function(index) {
  const p = products[index];
  editingProductId = index;
  console.log('[editProduct] Edit produk index', index, p);

  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-image').value = p.image;
  document.getElementById('prod-desc').value = p.description;
};

// Hapus produk
window.deleteProduct = async function(index) {
  const produk = products[index];
  if (!confirm(`Yakin ingin menghapus produk: ${produk.name}?`)) return;

  console.log('[deleteProduct] Menghapus produk index', index, produk);
  products.splice(index, 1);

  try {
    await saveProductsToGitHub(products);
    alert('Produk berhasil dihapus');
    renderTable();
  } catch (err) {
    console.error('[deleteProduct] Gagal hapus:', err);
    alert('Gagal menghapus produk: ' + err.message);
  }
};

// Reset form
function resetForm() {
  console.log('[resetForm] Reset form');
  editingProductId = null;
  productForm.reset();
}

// Simpan ke GitHub
async function saveProductsToGitHub(updatedProducts) {
  console.log('[saveProductsToGitHub] Menyimpan ke GitHub...');
  const sha = await fetchFileSHA();
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

  const content = btoa(JSON.stringify(updatedProducts, null, 2)); // base64
  const message = editingProductId !== null ? 'Update produk' : 'Tambah produk';

  const body = {
    message,
    content,
    sha,
    branch: GITHUB_BRANCH
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json();
    console.error('[saveProductsToGitHub] Gagal update:', errData);
    throw new Error(errData.message || 'Gagal update GitHub');
  }

  const result = await res.json();
  console.log('[saveProductsToGitHub] Sukses update:', result);
  return result;
}

// Init
console.log('[init] Mengecek status login...');
checkLogin();