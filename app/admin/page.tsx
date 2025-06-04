"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>({
    id: "",
    name: "",
    price: 0,
    image: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    if (localStorage.getItem("admin") !== "true") {
      window.location.href = "/admin/login";
    }
    axios.get("/api/products").then((res) => setProducts(res.data));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.id) {
      // EDIT MODE
      await axios.put("/api/products", form);
      alert("Produk berhasil diperbarui!");
    } else {
      // ADD MODE
      await axios.post("/api/products", { ...form, id: Date.now().toString() });
      alert("Produk berhasil ditambahkan!");
    }

    setForm({ id: "", name: "", price: 0, image: "", description: "", category: "" });
    location.reload();
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Admin Panel</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Nama" name="name" value={form.name} onChange={handleChange} />
        <input className="w-full p-2 border rounded" placeholder="Harga" name="price" type="number" value={form.price} onChange={handleChange} />
        <input className="w-full p-2 border rounded" placeholder="Gambar URL" name="image" value={form.image} onChange={handleChange} />
        <input className="w-full p-2 border rounded" placeholder="Kategori" name="category" value={form.category} onChange={handleChange} />
        <textarea className="w-full p-2 border rounded" placeholder="Deskripsi" name="description" value={form.description} onChange={handleChange} />

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          {form.id ? "Update Produk" : "Tambah Produk"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mt-6 mb-2">Produk Saat Ini</h2>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id} className="border p-2 rounded">
            <div className="flex justify-between items-center">
              <div>
                <strong>{p.name}</strong> - Rp {p.price.toLocaleString()}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setForm(p)}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Yakin mau hapus produk ini?")) {
                      await axios.delete("/api/products", { data: { id: p.id } });
                      alert("Produk dihapus!");
                      location.reload();
                    }
                  }}
                  className="text-red-600"
                >
                  Hapus
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}