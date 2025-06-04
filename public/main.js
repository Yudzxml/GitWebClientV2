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
const productsGrid     = document.getElementById('productsGrid');
const searchInput      = document.getElementById('searchInput');
const darkModeToggle   = document.getElementById('darkModeToggle');
const openCartBtn      = document.getElementById('openCartBtn');
const sidebar          = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggle');
const sidebarCloseBtn  = document.getElementById('sidebarClose');

const loginSection = document.getElementById('loginSection');
const adminPanel   = document.getElementById('adminPanel');
const cartSection  = document.getElementById('cartSection');

const cartCountSpan      = document.getElementById('cartCount');
const cartItemsUl        = document.getElementById('cartItems');
const cartTotalPriceSpan = document.getElementById('cartTotalPrice');
const checkoutBtn        = document.getElementById('checkoutBtn');

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c⚙️ DOMContentLoaded: Inisialisasi mulai', 'color: teal; font-weight: bold;');

  // Pastikan sidebar tertutup penuh di awal
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
// FETCH FUNCTIONS 
// ===========================
/*
async function fetchAllProducts() {
  try {
    console.log('📡 fetchAllProducts: memulai fetch');
    const response = await fetch('https://api.github.com/repos/Yudzxml/WebClientV1/contents/products.json', {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    console.log('📡 fetchAllProducts: response status', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('📡 fetchAllProducts: data mentah', data);
    const decoded = JSON.parse(atob(data.content));
    console.log('📡 fetchAllProducts: data parsed', decoded);
    return { products: decoded };
  } catch (err) {
    console.error('❌ fetchAllProducts: Gagal', err);
    throw err;
  }
}
*/
