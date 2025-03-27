/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // importante
  distDir: "out", // opcional: onde os arquivos exportados vão
  images: {
    unoptimized: true // necessário para next/image funcionar com export
  },
  basePath: "/retex-web" // obrigatório para funcionar no GitHub Pages
};

module.exports = nextConfig;
