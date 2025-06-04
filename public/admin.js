// ===========================
// KONSTANTA & STATE ADMIN
// ===========================
const loginSection          = document.getElementById('loginSection');
const adminPanel            = document.getElementById('adminPanel');
const loginForm             = document.getElementById('loginForm');
const logoutBtn             = document.getElementById('logoutBtn');
const productForm           = document.getElementById('productForm');
const productFormTitle      = document.getElementById('productFormTitle');
const adminProductList      = document.getElementById('adminProductList');
const editingProductIdInput = document.getElementById('editingProductId');
const addPackageBtn         = document.getElementById('addPackageBtn');
const packagesWrapper       = document.getElementById('packagesWrapper');

// Kredensial admin (hardcode)
const ADMIN_EMAIL    = 'yudzxml@gmail.com';
const ADMIN_PASSWORD = 'Yudzxml1122';

// ===========================
// 0. Inisialisasi: Pastikan form paket punya satu baris default
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c[Admin] DOMContentLoaded: inisialisasi admin panel', 'color: teal; font-weight: bold;');
  // Tambahkan satu baris paket default agar form tidak kosong
  resetProductForm(false);

  // Cek status login
  const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
  console.log(`[Admin] Status login awal: ${isLoggedIn}`);
  if (isLoggedIn) {
    showAdminPanel();
  } else {
    showLoginForm();
  }
});

// ===========================
// 1. LOGIN / LOGOUT
// ===========================

// Tampilkan Login Form, sembunyikan Admin Panel
function showLoginForm() {
  console.log('[Admin] showLoginForm: menampilkan form login, sembunyikan admin panel');
  loginSection.classList.remove('hidden');
  adminPanel.classList.add('hidden');
}

// Tampilkan Admin Panel, sembunyikan Login Form
function showAdminPanel() {
  console.log('[Admin] showAdminPanel: menampilkan admin panel, sembunyikan form login');
  loginSection.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  refreshAdminProductList();
}

// Handle submit login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPassword').value.trim();
  console.log(`[Admin] loginForm submit: email="${email}"`);

  if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdminLoggedIn', 'true');
    console.log('[Admin] loginForm: kredensial benar, simpan status login dan tampilkan admin panel');
    alert('Login berhasil!');
    showAdminPanel();
  } else {
    console.warn('[Admin] loginForm: kredensial salah');
    alert('Email atau password salah.');
  }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
  console.log('[Admin] logoutBtn clicked: logout dan reload halaman');
  sessionStorage.removeItem('isAdminLoggedIn');
  location.reload();
});

// ===========================
// 2. CRUD PRODUK (ADMIN)
// ===========================

// Tambah Baris Input Paket Baru
addPackageBtn.addEventListener('click', () => {
  console.log('[Admin] addPackageBtn clicked: tambahkan baris paket baru');
  const pkgDiv = document.createElement('div');
  pkgDiv.className = 'package-item';
  pkgDiv.innerHTML = `
    <input type="text" class="pkg-name" placeholder="Nama Paket (contoh: Paket 1)" required />
    <input type="number" class="pkg-price" placeholder="Harga (Rp)" required min="0" />
    <button type="button" class="remove-package">✕</button>
  `;
  packagesWrapper.appendChild(pkgDiv);

  // Event remove
  pkgDiv.querySelector('.remove-package').addEventListener('click', () => {
    console.log('[Admin] remove-package clicked: hapus satu baris paket');
    packagesWrapper.removeChild(pkgDiv);
  });
});

// Handle Submit Form (Tambah / Edit)
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('[Admin] productForm submit: simpan data produk (add/edit)');

  // Ambil data dari form
  const imageUrl    = document.getElementById('prodImage').value.trim();
  const name        = document.getElementById('prodName').value.trim();
  const description = document.getElementById('prodDesc').value.trim();

  console.log(`[Admin] Data form - imageUrl: "${imageUrl}", name: "${name}", description: "${description}"`);

  // Ambil semua paket
  const pkgNames  = Array.from(document.querySelectorAll('.pkg-name'))
    .map((el) => el.value.trim());
  const pkgPrices = Array.from(document.querySelectorAll('.pkg-price'))
    .map((el) => parseInt(el.value.trim(), 10));

  // Beri peringatan kalau ada nama paket tanpa harga atau sebaliknya
  if (pkgNames.some((pn) => pn === '') || pkgPrices.some((pp) => isNaN(pp))) {
    console.warn('[Admin] productForm: ada paket dengan nama kosong atau harga invalid');
    alert('Pastikan semua nama dan harga paket terisi dengan benar.');
    return;
  }

  // Buat array packages
  const packages = pkgNames.map((pName, i) => ({
    name: pName,
    price: pkgPrices[i],
  }));
  console.log('[Admin] productForm: array packages =', packages);

  // Buat objek produk
  const productData = {
    imageUrl,
    name,
    description,
    packages,
  };
  console.log('[Admin] productForm: productData =', productData);

  // Cek mode (add / edit)
  const editingId = editingProductIdInput.value;
  if (editingId) {
    console.log(`[Admin] productForm: mode EDIT untuk ID="${editingId}"`);
  } else {
    console.log('[Admin] productForm: mode ADD produk baru');
  }

  try {
    if (editingId) {
      // EDIT MODE
      await editProductById(editingId, { id: editingId, ...productData });
      console.log('[Admin] productForm: editProductById berhasil');
      alert('Produk berhasil diupdate!');
    } else {
      // ADD MODE
      await addProduct(productData);
      console.log('[Admin] productForm: addProduct berhasil');
      alert('Produk berhasil ditambahkan!');
    }
  } catch (err) {
    console.error('[Admin] productForm: Terjadi kesalahan saat menyimpan ke GitHub:', err);
    alert('Terjadi kesalahan saat menyimpan ke GitHub.');
  }

  // Reset form setelah simpan
  resetProductForm();
  refreshAdminProductList();
  loadAndRenderProducts(); // reload produk di halaman utama (pastikan fungsi ini ada di main.js)
});

// Reset form ke kondisi awal (setelah submit)
// Parameter `clearPackages` default true; jika false, kita ingin tambahkan satu paket default tanpa clear semua
function resetProductForm(clearPackages = true) {
  console.log('[Admin] resetProductForm: reset form produk');
  editingProductIdInput.value = '';
  productFormTitle.textContent = 'Tambah Produk Baru';
  productForm.reset();

  if (clearPackages) {
    // Hapus semua paket
    packagesWrapper.innerHTML = '';
  }
  // Tambahkan satu baris paket default agar user tidak submit tanpa paket
  const pkgDiv = document.createElement('div');
  pkgDiv.className = 'package-item';
  pkgDiv.innerHTML = `
    <input type="text" class="pkg-name" placeholder="Nama Paket (contoh: Paket 1)" required />
    <input type="number" class="pkg-price" placeholder="Harga (Rp)" required min="0" />
    <button type="button" class="remove-package">✕</button>
  `;
  packagesWrapper.appendChild(pkgDiv);
  pkgDiv.querySelector('.remove-package').addEventListener('click', () => {
    console.log('[Admin] remove-package (default) clicked: hapus satu paket default');
    packagesWrapper.removeChild(pkgDiv);
  });
}

// Refresh daftar produk di admin (dengan tombol Edit & Hapus)
async function refreshAdminProductList() {
  console.log('[Admin] refreshAdminProductList: memuat ulang daftar produk admin');
  adminProductList.innerHTML = '';
  let productsData;
  try {
    const result = await fetchAllProducts();
    productsData = result.products;
    console.log('[Admin] refreshAdminProductList: fetchAllProducts berhasil, jumlah produk =', productsData.length);
  } catch (err) {
    console.error('[Admin] refreshAdminProductList: Gagal fetchAllProducts:', err);
    productsData = [];
  }

  if (!productsData || !productsData.length) {
    console.log('[Admin] refreshAdminProductList: tidak ada produk, tampilkan "Belum ada produk."');
    adminProductList.innerHTML = '<li>Belum ada produk.</li>';
    return;
  }

  productsData.forEach((prod) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${prod.name}</span>
      <div class="admin-actions">
        <button class="edit-btn" data-id="${prod.id}">Edit</button>
        <button class="delete-btn" data-id="${prod.id}">Hapus</button>
      </div>
    `;
    adminProductList.appendChild(li);
  });

  // Event Edit
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      console.log(`[Admin] edit-btn clicked: ID="${id}"`);
      await fillFormForEdit(id);
    });
  });

  // Event Hapus
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      console.log(`[Admin] delete-btn clicked: ID="${id}"`);
      const confirmDel = confirm('Yakin ingin menghapus produk ini?');
      if (!confirmDel) {
        console.log('[Admin] delete-btn: user batal menghapus produk');
        return;
      }
      try {
        await deleteProductById(id);
        console.log('[Admin] deleteProductById berhasil');
        alert('Produk berhasil dihapus!');
        refreshAdminProductList();
        loadAndRenderProducts(); // reload produk di halaman utama
      } catch (err) {
        console.error('[Admin] deleteProductById: Gagal hapus produk:', err);
        alert('Gagal menghapus produk.');
      }
    });
  });
}

// Isi form dengan data produk untuk mode edit
async function fillFormForEdit(productId) {
  console.log(`[Admin] fillFormForEdit: mengambil data untuk ID="${productId}"`);
  let productsData;
  try {
    const result = await fetchAllProducts();
    productsData = result.products;
    console.log('[Admin] fillFormForEdit: fetchAllProducts berhasil');
  } catch (err) {
    console.error('[Admin] fillFormForEdit: Gagal fetchAllProducts:', err);
    alert('Gagal mengambil data produk.');
    return;
  }

  const prod = productsData.find((p) => p.id === productId);
  if (!prod) {
    console.warn('[Admin] fillFormForEdit: produk tidak ditemukan');
    alert('Produk tidak ditemukan.');
    return;
  }

  console.log('[Admin] fillFormForEdit: mempersiapkan form edit dengan data', prod);
  // Atur judul form
  productFormTitle.textContent = 'Edit Produk';
  editingProductIdInput.value = prod.id;
  // Isi field
  document.getElementById('prodImage').value = prod.imageUrl;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodDesc').value = prod.description;
  // Hapus paket lama
  packagesWrapper.innerHTML = '';
  // Tambah input paket sesuai data
  prod.packages.forEach((pkg) => {
    const pkgDiv = document.createElement('div');
    pkgDiv.className = 'package-item';
    pkgDiv.innerHTML = `
      <input type="text" class="pkg-name" placeholder="Nama Paket" required />
      <input type="number" class="pkg-price" placeholder="Harga (Rp)" required min="0" />
      <button type="button" class="remove-package">✕</button>
    `;
    packagesWrapper.appendChild(pkgDiv);
    pkgDiv.querySelector('.pkg-name').value  = pkg.name;
    pkgDiv.querySelector('.pkg-price').value = pkg.price;

    // Event remove
    pkgDiv.querySelector('.remove-package').addEventListener('click', () => {
      console.log('[Admin] remove-package (edit) clicked: hapus satu baris paket');
      packagesWrapper.removeChild(pkgDiv);
    });
  });
}