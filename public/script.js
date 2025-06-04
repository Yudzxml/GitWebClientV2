const toggleBtn = document.querySelector('#toggle-dark');
const body = document.body;

toggleBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  console.log('Toggled dark mode:', body.classList.contains('dark-mode'));
});

const productGrid = document.getElementById('product-grid');
let productsData = [];

function renderStars(rating) {
  const fullStar = '★';
  const emptyStar = '☆';
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? fullStar : emptyStar;
  }
  return stars;
}

// Keranjang belanja disimpan di localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
console.log('Keranjang di-load dari localStorage:', cart);

// Update jumlah item di keranjang
function updateCartCount() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartCountElem = document.getElementById('cart-count');
  if (cartCountElem) cartCountElem.textContent = count;
  console.log('Jumlah item di keranjang:', count);
}

// Fungsi tambah ke keranjang
function addToCart(product) {
  console.log('Menambahkan produk ke keranjang:', product);
  const index = cart.findIndex(item => item.id === product.id);
  if (index > -1) {
    cart[index].qty += 1;
    console.log('Produk sudah ada, menambah qty:', cart[index]);
  } else {
    cart.push({...product, qty: 1});
    console.log('Produk baru ditambahkan ke keranjang');
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name} berhasil ditambahkan ke keranjang! 🛒`);
}

function renderProducts(products) {
  console.log('Render produk:', products);
  if (products.length === 0) {
    productGrid.innerHTML = '<p>Produk tidak ditemukan.</p>';
    return;
  }

  productGrid.innerHTML = '';
  products.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <img src="${prod.image}" alt="${prod.name}" />
      <div class="product-info">
        <h3 title="${prod.name}">${prod.name}</h3>
        <p class="product-desc">${prod.description ? prod.description : '-'}</p>
        <div class="price">Rp${prod.price.toLocaleString()}</div>
        <div class="rating">${renderStars(prod.rating || 4)}</div>
        <button class="buy-btn" onclick="buyWhatsApp('${encodeURIComponent(prod.name)}', ${prod.price})">Beli via WhatsApp</button>
        <button class="add-cart-btn" data-id="${prod.id}">Tambah ke Keranjang</button>
      </div>
    `;

    productGrid.appendChild(card);
  });

  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const product = products.find(p => p.id == id);
      if (product) {
        addToCart(product);
      } else {
        console.warn('Produk tidak ditemukan untuk ID:', id);
      }
    });
  });
}

function buyWhatsApp(name, price) {
  const waNumber = '6283872031397';
  const message = `Halo, saya ingin membeli produk *${decodeURIComponent(name)}* dengan harga Rp ${price.toLocaleString()}.`;
  const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  console.log('Checkout satu produk via WhatsApp:', url);
  window.open(url, '_blank');
}

async function loadProducts() {
  console.log('Memuat produk dari GitHub...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/Yudzxml/WebClientV1/main/products.json');
    if (!res.ok) throw new Error('Gagal load produk');
    productsData = await res.json();
    console.log('Produk berhasil dimuat:', productsData);
    renderProducts(productsData);
    updateCartCount();
  } catch (e) {
    productGrid.innerHTML = '<p>Error load produk.</p>';
    console.error('Gagal load produk:', e);
  }
}

loadProducts();

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

function filterProducts() {
  const query = searchInput.value.toLowerCase();
  console.log('Mencari produk dengan keyword:', query);
  const filtered = productsData.filter(p => p.name.toLowerCase().includes(query));
  renderProducts(filtered);
}

searchBtn.addEventListener('click', filterProducts);
searchInput.addEventListener('keyup', e => {
  if (e.key === 'Enter') filterProducts();
});

const cartModal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElem = document.getElementById('cart-total');
const closeCartBtn = document.getElementById('close-cart');
const cartBtn = document.querySelector('.cart-btn');
const checkoutBtn = document.getElementById('checkout-btn');

function renderCartModal() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p>Keranjang kosong 😢</p>';
    cartTotalElem.textContent = '';
    return;
  }
  
  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span>${item.name} (x${item.qty})</span>
      <span>Rp${(item.price * item.qty).toLocaleString()}</span>
      <button data-index="${idx}">Hapus</button>
    `;
    cartItemsContainer.appendChild(div);
  });

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  cartTotalElem.textContent = `Total: Rp${total.toLocaleString()}`;
  console.log('Isi keranjang saat ini:', cart);
  console.log('Total keranjang:', total);

  cartItemsContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      const removedItem = cart.splice(index, 1);
      console.log('Item dihapus dari keranjang:', removedItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      renderCartModal();
    });
  });
}

cartBtn.addEventListener('click', () => {
  console.log('Modal keranjang dibuka');
  renderCartModal();
  cartModal.classList.remove('hidden');
});

closeCartBtn.addEventListener('click', () => {
  console.log('Modal keranjang ditutup via tombol');
  cartModal.classList.add('hidden');
});

cartModal.addEventListener('click', (e) => {
  if (e.target === cartModal) {
    console.log('Modal keranjang ditutup dengan klik luar modal');
    cartModal.classList.add('hidden');
  }
});

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Keranjangmu kosong! Tambahkan produk dulu ya 😅');
    console.warn('Checkout dibatalkan: keranjang kosong');
    return;
  }

  const waNumber = '6283872031397';
  let message = 'Halo, saya ingin membeli produk berikut:\n\n';

  cart.forEach(item => {
    message += `- ${item.name} (x${item.qty}): Rp${(item.price * item.qty).toLocaleString()}\n`;
  });

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  message += `\nTotal harga: Rp${total.toLocaleString()}\n\nTerima kasih!`;

  const waURL = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  console.log('Checkout semua item via WhatsApp:', waURL);
  window.open(waURL, '_blank');
});