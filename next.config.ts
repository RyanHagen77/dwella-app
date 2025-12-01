/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep clean URLs like /stats instead of /stats/
  trailingSlash: false,

  // Disable built-in image optimization — all assets come from /public
  images: {
    unoptimized: true,
    // Add domains here if you later load remote images:
    // domains: ["example.com"],
  },

  // Good default for Vercel/Node deployment
  output: "standalone",

  // 🚫 Don’t block builds on lint or type errors (demo-friendly)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Caching: HTML revalidates; static assets are long-cached
  async headers() {
    return [
      {
        // Pages / API responses: revalidate each request
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Next build artifacts
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Your static files under /public
        source: "/:all*(svg|png|jpg|jpeg|webp|gif|ico|woff2|woff|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
