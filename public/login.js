document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = e.target[0].value;
  const password = e.target[1].value;

  if (email === "yudzxml@gmail.com" && password === "@Yudzxml1122") {
    document.getElementById('login-form').style.display = "none";
    document.getElementById('admin-panel').style.display = "block";
    loadProducts();
  } else {
    alert("Login gagal!");
  }
});

async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  const list = document.getElementById("product-list");
  list.innerHTML = data.map((p, i) => `
    <div>
      ${p.name} - Rp${p.price}
      <button onclick="deleteProduct(${i})">🗑️</button>
    </div>
  `).join("");
}

document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const newProduct = {
    name: form.name.value,
    price: form.price.value,
    image: form.image.value
  };

  await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProduct)
  });
  loadProducts();
  form.reset();
});

async function deleteProduct(index) {
  await fetch(`/api/products/${index}`, { method: "DELETE" });
  loadProducts();
}