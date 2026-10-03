/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
