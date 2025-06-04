"use client";

import React from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface Props {
  product: Product;
  onBuy: (product: Product) => void;
}

export default function ProductCard({ product, onBuy }: Props) {
  return (
    <div className="border rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="h-40 object-contain mb-3"
        loading="lazy"
      />
      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
      <div className="mt-auto flex justify-between items-center">
        <span className="font-bold text-indigo-600 text-lg">
          Rp {product.price.toLocaleString()}
        </span>
        <button
          onClick={() => onBuy(product)}
          className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition"
        >
          Beli
        </button>
      </div>
    </div>
  );
}