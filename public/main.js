// ===========================
// GLOBAL STATE
// ===========================
let allProducts = [];
let cart = [];
const CART_STORAGE_KEY = 'yudzxml1122';
const whatsappNumber = '6283872031397';

// ===========================
// ELEMENT REFERENCES
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
const productsGrid          = document.getElementById('productsGrid');
const searchInput           = document.getElementById('searchInput');
const darkModeToggle        = document.getElementById('darkModeToggle');
const openCartBtn           = document.getElementById('openCartBtn');
const sidebar               = document.getElementById('sidebar');
const sidebarToggleBtn      = document.getElementById('sidebarToggle');
const sidebarCloseBtn       = document.getElementById('sidebarClose');
const cartSection           = document.getElementById('cartSection');
const cartCountSpan         = document.getElementById('cartCount');
const cartItemsUl           = document.getElementById('cartItems');
const cartTotalPriceSpan    = document.getElementById('cartTotalPrice');
const checkoutBtn           = document.getElementById('checkoutBtn');

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚙️ DOMContentLoaded: Inisialisasi mulai', 'color: teal; font-weight: bold;');
  sidebar.classList.remove('open');
  hideAllSubSections();

  loadDarkModePref();
  loadCartFromStorage();
  renderCartCount();
  loadAndRenderProducts();

  searchInput.addEventListener('input', handleSearch);
  darkModeToggle.addEventListener('click', toggleDarkMode);

  openCartBtn.addEventListener('click', () => {
    console.log('🔍 Klik tombol Keranjang');
    if (sidebar.classList.contains('open')) {
      closeSidebar();
      setTimeout(() => openSidebar('cart'), 200);
    } else {
      openSidebar('cart');
    }
  });

  sidebarToggleBtn.addEventListener('click', () => {
    console.log('🔍 Klik tombol Admin/Menu');
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar('admin');
    }
  });

  sidebarCloseBtn.addEventListener('click', () => {
    console.log('❌ Klik tombol tutup sidebar');
    closeSidebar();
  });

  checkoutBtn.addEventListener('click', () => {
    console.log('💬 Klik tombol Checkout via WhatsApp');
    checkoutViaWhatsApp();
  });

  console.log('%c✅ Inisialisasi selesai', 'color: green; font-weight: bold;');
});

// ===========================
// DARK MODE
// ===========================
function loadDarkModePref() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  console.log(`🌓 loadDarkModePref: mode gelap sebelumnya = ${isDark}`);
  if (isDark) {
    document.body.classList.add('dark-mode');
    console.log('🌓 loadDarkModePref: body.dark-mode ditambahkan');
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkNow = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkNow);
  console.log(`🌓 toggleDarkMode: mode gelap sekarang = ${isDarkNow}`);
}

// ===========================
// FETCH & RENDER PRODUK (CALL API NEXT.JS)
// ===========================
async function loadAndRenderProducts() {
  try {
    console.log('▶️ loadAndRenderProducts dipanggil');
    const { products } = await fetchAllProducts();
    console.log('▶️ loadAndRenderProducts: produk diterima', products);
    allProducts = products || [];
  } catch (err) {
    allProducts = [];
    console.error('❌ loadAndRenderProducts: Gagal fetch produk:', err);
  }
  renderProductGrid(allProducts);
}

async function fetchAllProducts() {
  console.log('↗️ fetchAllProducts: GET /api/products');
  const res = await fetch('/api/products', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Gagal fetch produk: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return { products: data };
}

function renderProductGrid(productsArray) {
  console.log(`🖼️ renderProductGrid: akan render ${productsArray.length} produk`);
  productsGrid.innerHTML = '';
  if (!productsArray.length) {
    console.log('🖼️ renderProductGrid: tidak ada produk, tampilkan pesan “Belum ada produk.”');
    productsGrid.innerHTML =
      '<p style="grid-column: 1 / -1; text-align:center;">Belum ada produk.</p>';
    return;
  }
  productsArray.forEach((prod) => {
    console.log(`  • Menambahkan kartu produk: ${prod.name} (ID: ${prod.id})`);
    const card = document.createElement('div');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = prod.imageUrl;
    img.alt = prod.name;
    img.className = 'product-image';
    card.appendChild(img);

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'product-body';

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = prod.name;
    bodyDiv.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = prod.description;
    bodyDiv.appendChild(desc);

    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'package-select';
    const select = document.createElement('select');
    prod.packages.forEach((pkg) => {
      const opt = document.createElement('option');
      opt.value = pkg.price;
      opt.textContent = `${pkg.name} — Rp ${formatRupiah(pkg.price)}`;
      select.appendChild(opt);
    });
    selectWrapper.appendChild(select);
    bodyDiv.appendChild(selectWrapper);

    const footerDiv = document.createElement('div');
    footerDiv.className = 'product-footer';

    const priceSpan = document.createElement('span');
    const selectedPrice = prod.packages[0]?.price || 0;
    priceSpan.className = 'product-price';
    priceSpan.textContent = `Rp ${formatRupiah(selectedPrice)}`;
    footerDiv.appendChild(priceSpan);

    const actionDiv = document.createElement('div');
    actionDiv.className = 'product-actions';
    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = 'Tambah ke Keranjang';
    actionDiv.appendChild(addToCartBtn);
    footerDiv.appendChild(actionDiv);

    bodyDiv.appendChild(footerDiv);
    card.appendChild(bodyDiv);
    productsGrid.appendChild(card);

    select.addEventListener('change', (e) => {
      priceSpan.textContent = `Rp ${formatRupiah(e.target.value)}`;
      console.log(`🔄 Produk ${prod.name}: paket diubah ke harga Rp ${e.target.value}`);
    });

    addToCartBtn.addEventListener('click', () => {
      const pkgName = select.options[select.selectedIndex].text.split(' — ')[0];
      const priceVal = parseInt(select.value, 10);
      console.log(`➕ Tombol “Tambah ke Keranjang” untuk ${prod.name} (paket: ${pkgName}, harga: ${priceVal})`);
      addToCart({
        id: prod.id,
        name: prod.name,
        imageUrl: prod.imageUrl,
        packageName: pkgName,
        price: priceVal,
        quantity: 1,
      });
    });
  });
}

// ===========================
// SEARCH PRODUK
// ===========================
function handleSearch(e) {
  const term = e.target.value.trim().toLowerCase();
  console.log(`🔎 handleSearch: keyword = "${term}"`);
  const filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
  );
  console.log(`🔎 handleSearch: ditemukan ${filtered.length} produk`);
  renderProductGrid(filtered);
}

// ===========================
// KERANJANG
// ===========================
function loadCartFromStorage() {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (stored) {
    cart = JSON.parse(stored);
    console.log('🛒 loadCartFromStorage: cart di-load dari storage', cart);
  } else {
    console.log('🛒 loadCartFromStorage: tidak ada data cart di storage');
  }
}

function saveCartToStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  console.log('🛒 saveCartToStorage: cart disimpan ke storage', cart);
}

function renderCartCount() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  console.log(`🧮 renderCartCount: total quantity = ${totalQty}`);
  cartCountSpan.textContent = totalQty;
}

function addToCart(item) {
  console.log(`🛒 addToCart: mencoba menambah ke keranjang`, item);
  const idx = cart.findIndex(
    (c) => c.id === item.id && c.packageName === item.packageName
  );
  if (idx > -1) {
    cart[idx].quantity += 1;
    console.log(`🛒 addToCart: item sudah ada, quantity diincrement (sekarang ${cart[idx].quantity})`);
  } else {
    cart.push(item);
    console.log(`🛒 addToCart: item baru ditambahkan ke keranjang`);
  }
  saveCartToStorage();
  renderCartCount();
  alert(`"${item.name}" berhasil ditambahkan ke keranjang.`);
}

function renderCartItems() {
  console.log(`🧺 renderCartItems: render ${cart.length} item`);
  cartItemsUl.innerHTML = '';
  if (!cart.length) {
    console.log('🧺 renderCartItems: keranjang kosong');
    cartItemsUl.innerHTML = '<li>Keranjang kosong.</li>';
    cartTotalPriceSpan.textContent = 'Rp 0';
    return;
  }
  let total = 0;
  cart.forEach((c, i) => {
    total += c.price * c.quantity;
    console.log(`  • Item: ${c.name} (${c.packageName}), qty=${c.quantity}, subtotal=${c.price * c.quantity}`);
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${c.name} (${c.packageName}) x${c.quantity}</span>
      <span>Rp ${formatRupiah(c.price * c.quantity)}</span>
      <button class="remove-cart-item" data-index="${i}">✕</button>
    `;
    cartItemsUl.appendChild(li);
  });
  console.log(`🧺 renderCartItems: total semua Rp ${total}`);
  cartTotalPriceSpan.textContent = `Rp ${formatRupiah(total)}`;

  document.querySelectorAll('.remove-cart-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      console.log(`➖ removeCartItem: menghapus index ${index}`);
      cart.splice(index, 1);
      saveCartToStorage();
      renderCartItems();
      renderCartCount();
    });
  });
}

// ===========================
// BUKA / TUTUP SIDEBAR
// ===========================
function hideAllSubSections() {
  console.log('🚪 hideAllSubSections: menyembunyikan semua sub-sections');
  [loginSection, adminPanel, cartSection].forEach((sec) => {
    sec.classList.add('hidden');
  });
}

function openSidebar(section) {
  console.log(`🚪 openSidebar: membuka sidebar section="${section}"`);
  sidebar.classList.add('open');
  hideAllSubSections();
  if (section === 'admin') {
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    console.log(`  🔑 Admin logged in? ${isAdminLoggedIn}`);
    if (isAdminLoggedIn) {
      adminPanel.classList.remove('hidden');
      console.log('  🚪 Menampilkan adminPanel');
    } else {
      loginSection.classList.remove('hidden');
      console.log('  🚪 Menampilkan loginSection');
    }
  } else if (section === 'cart') {
    cartSection.classList.remove('hidden');
    console.log('  🚪 Menampilkan cartSection');
    renderCartItems();
  }
}

function closeSidebar() {
  console.log('❌ closeSidebar: menutup sidebar');
  sidebar.classList.remove('open');
  hideAllSubSections();
}

window.addEventListener('logoutEvent', () => {
  closeSidebar();
});

// ===========================
// CHECKOUT VIA WHATSAPP
// ===========================
function checkoutViaWhatsApp() {
  console.log('📲 checkoutViaWhatsApp: dipanggil');
  if (!cart.length) {
    console.warn('📲 checkoutViaWhatsApp: keranjang kosong, batal checkout');
    alert('Keranjang kosong!');
    return;
  }
  let text = 'Halo, saya ingin memesan:\n';
  cart.forEach((c) => {
    text += `- ${c.name} (${c.packageName}) x${c.quantity} = Rp ${formatRupiah(
      c.price * c.quantity
    )}\n`;
  });
  const totalAll = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  text += `Total: Rp ${formatRupiah(totalAll)}\n`;
  console.log(`📲 checkoutViaWhatsApp: isi pesan =\n${text}`);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;
  console.log('📲 checkoutViaWhatsApp: membuka URL', url);
  window.open(url, '_blank');
}

// ===========================
// FORMAT RUPIAH
// ===========================
function formatRupiah(number) {
  const result = number
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  console.log(`🪙 formatRupiah: input=${number}, output=${result}`);
  return result;
}

// ===========================
// KONSTANTA & STATE ADMIN
// ===========================
const ADMIN_EMAIL    = 'yudzxml@gmail.com';
const ADMIN_PASSWORD = '@Yudzxml1122';

// ===========================
// 0. Inisialisasi ADMIN
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c[Admin] DOMContentLoaded: inisialisasi admin panel', 'color: teal; font-weight: bold;');

  // Tambahkan satu baris paket default agar form tidak kosong
  resetProductForm(false);

// Buka sidebar di section admin (login atau panel tergantung status)
 console.log('[Admin] Memanggil openSidebar("admin") pada load');

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
function showLoginForm() {
  console.log('[Admin] showLoginForm: menampilkan form login, sembunyikan admin panel');
  loginSection.classList.remove('hidden');
  adminPanel.classList.add('hidden');
}

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
    console.log('[Admin] loginForm: kredensial benar, set session dan tampilkan admin panel');
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

  // Validasi paket
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
      // EDIT MODE (PUT)
      await editProductById(editingId, productData);
      console.log('[Admin] productForm: editProductById berhasil');
      alert('Produk berhasil diupdate!');
    } else {
      // ADD MODE (POST)
      await addProduct(productData);
      console.log('[Admin] productForm: addProduct berhasil');
      alert('Produk berhasil ditambahkan!');
    }
  } catch (err) {
    console.error('[Admin] productForm: Terjadi kesalahan saat menyimpan ke GitHub:', err);
    alert('Terjadi kesalahan saat menyimpan ke GitHub.');
  }
  resetProductForm();
  refreshAdminProductList();
  loadAndRenderProducts();
});

function resetProductForm(clearPackages = true) {
  console.log('[Admin] resetProductForm: reset form produk');
  editingProductIdInput.value = '';
  productFormTitle.textContent = 'Tambah Produk Baru';
  productForm.reset();

  if (clearPackages) {
    packagesWrapper.innerHTML = '';
  }
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

// ===========================
// Fungsi CRUD via API
// ===========================
async function addProduct(newProductObj) {
  console.log('[Admin] addProduct: POST /api/products', newProductObj);
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newProductObj),
  });
  if (!res.ok) {
    throw new Error(`Gagal tambah produk: ${res.status} ${res.statusText}`);
  }
  const result = await res.json();
  console.log('[Admin] addProduct: response commit sha =', result.commit);
  return result;
}

async function editProductById(productId, updatedFields) {
  console.log(`[Admin] editProductById: PUT /api/products id=${productId}`, updatedFields);
  const payload = { id: productId, ...updatedFields };
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Gagal update produk: ${res.status} ${res.statusText}`);
  }
  const result = await res.json();
  console.log('[Admin] editProductById: response commit sha =', result.commit);
  return result;
}

async function deleteProductById(productId) {
  console.log(`[Admin] deleteProductById: DELETE /api/products id=${productId}`);
  const res = await fetch('/api/products', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: productId }),
  });
  if (!res.ok) {
    throw new Error(`Gagal hapus produk: ${res.status} ${res.statusText}`);
  }
  const result = await res.json();
  console.log('[Admin] deleteProductById: response commit sha =', result.commit);
  return result;
}

// Refresh daftar produk di admin (dengan tombol Edit & Hapus)
async function refreshAdminProductList() {
  console.log('[Admin] refreshAdminProductList: memuat ulang daftar produk admin');
  adminProductList.innerHTML = '';
  let productsData;
  try {
    const { products } = await fetchAllProducts();
    productsData = products;
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
    const { products } = await fetchAllProducts();
    productsData = products;
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
  document.getElementById('prodName').value  = prod.name;
  document.getElementById('prodDesc').value  = prod.description;
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