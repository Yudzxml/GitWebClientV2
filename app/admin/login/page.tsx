"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  function handleLogin(e: any) {
    e.preventDefault();
    if (email === "yudzxml@gmail.com" && pass === "@Yudzxml1122") {
      localStorage.setItem("admin", "true");
      router.push("/admin");
    } else {
      alert("Login gagal, coba lagi");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">Login Admin</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setPass(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}