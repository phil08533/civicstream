// Static export for GitHub Pages. For a project site served at
// https://<user>.github.io/civicstream, set NEXT_PUBLIC_BASE_PATH=/civicstream.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
