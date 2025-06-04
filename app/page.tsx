import React, { useState } from "react";
import ProductCard from "../components/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

export default function HomePage() {
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    // TODO: Ganti URL ini ke GitHub raw JSON kamu nanti
    fetch(
      "https://raw.githubusercontent.com/Yudzxml/WebClientV1/main/products.json"
    )
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products);
      });
  }, []);

  function handleBuy(product: Product) {
    // Format pesan WhatsApp untuk checkout
    const text = `Halo, saya mau pesan produk:\n- ${product.name}\n- Harga: Rp ${product.price.toLocaleString()}\nMohon info selanjutnya.`;
    const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
    window.open(waLink, "_blank");
  }

  return (
    <main className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">YUDZXML STORE 77</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onBuy={handleBuy} />
        ))}
      </div>
    </main>
  );
}