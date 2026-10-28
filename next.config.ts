import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Páginas continuam pré-renderizadas no build; só /api/* roda no servidor (votos do público).
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
