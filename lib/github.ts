import axios from "axios";

const headers = {
  Accept: "application/vnd.github.v3+json",
};

export async function fetchProductsFromGitHub() {
  const res = await axios.get(
    `https://raw.githubusercontent.com/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/${process.env.GITHUB_FILE_PATH}`,
    { headers }
  );
  return res.data.products;
}