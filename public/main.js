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
const sidebarToggle    = document.getElementById('sidebarToggle');
const sidebar          = document.getElementById('sidebar');
const sidebarClose     = document.getElementById('sidebarClose');
const goAdminBtn       = document.getElementById('goAdminBtn');
const goCartBtn        = document.getElementById('goCartBtn');
const searchInput      = document.getElementById('searchInput');
const darkModeToggle   = document.getElementById('darkModeToggle');
const openCartBtn      = document.getElementById('openCartBtn');
const productsGrid     = document.getElementById('productsGrid');
const cartCountSpan    = document.getElementById('cartCount');
const goContactBtn        = document.getElementById('goContactBtn');
// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚙️ DOMContentLoaded: Inisialisasi mulai', 'color: teal; font-weight: bold;');

  // Sidebar toggle
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
  });
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });


  // Dark Mode
  loadDarkModePref();
  darkModeToggle.addEventListener('click', toggleDarkMode);
  loadAndRenderProducts();
  searchInput.addEventListener('input', handleSearch);
  loadCartFromStorage();
  renderCartCount();
  openCartBtn.addEventListener('click', () => {
    window.location.href = 'cart.html';
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
// FETCH & RENDER PRODUK
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
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'product-image-wrapper';
    const imgEl = document.createElement('img');
    imgEl.src = prod.imageUrl;
    imgEl.alt = prod.name;
    imgEl.className = 'product-image';
    imgWrapper.appendChild(imgEl);
    card.appendChild(imgWrapper);
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
// KERANJANG (untuk cartCount saja)
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

// ==========================================
// TOAST NOTIFICATION
// ==========================================
let toastTimeoutId;
function showToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('show');
  toastTimeoutId = setTimeout(hideToast, 5500);
}

function hideToast() {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  showToast();
  const btnOk = document.getElementById('toastOk');
  if (btnOk) {
    btnOk.addEventListener('click', () => {
      clearTimeout(toastTimeoutId);
      hideToast();
    });
  }
});