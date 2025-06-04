import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const repo = process.env.GITHUB_REPO!;
const token = process.env.GITHUB_TOKEN!;
const branch = process.env.GITHUB_BRANCH!;
const filePath = process.env.GITHUB_FILE_PATH!;
const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;

async function getFileSha(): Promise<string> {
  const res = await axios.get(
    `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Authorization: `token ${token}`,
      },
    }
  );
  return res.data.sha;
}

export async function GET() {
  const res = await axios.get(rawUrl);
  return NextResponse.json(res.data.products);
}

export async function POST(req: NextRequest) {
  const newProduct = await req.json();
  const sha = await getFileSha();
  const raw = await axios.get(rawUrl);
  const current = raw.data.products;

  const updated = [...current, newProduct];

  const content = Buffer.from(
    JSON.stringify({ products: updated }, null, 2)
  ).toString("base64");

  const res = await axios.put(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      message: "Add product",
      content,
      sha,
      branch,
    },
    {
      headers: {
        Authorization: `token ${token}`,
      },
    }
  );

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const updatedProduct = await req.json();
  const sha = await getFileSha();
  const raw = await axios.get(rawUrl);
  const current = raw.data.products;

  const updated = current.map((item: any) =>
    item.id === updatedProduct.id ? updatedProduct : item
  );

  const content = Buffer.from(
    JSON.stringify({ products: updated }, null, 2)
  ).toString("base64");

  await axios.put(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      message: `Edit product ${updatedProduct.id}`,
      content,
      sha,
      branch,
    },
    {
      headers: { Authorization: `token ${token}` },
    }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const sha = await getFileSha();
  const raw = await axios.get(rawUrl);
  const current = raw.data.products;

  const updated = current.filter((item: any) => item.id !== id);

  const content = Buffer.from(
    JSON.stringify({ products: updated }, null, 2)
  ).toString("base64");

  await axios.put(
    `https://api.github.com/repos/${repo}/contents/${filePath}`,
    {
      message: `Delete product ${id}`,
      content,
      sha,
      branch,
    },
    {
      headers: { Authorization: `token ${token}` },
    }
  );

  return NextResponse.json({ success: true });
}