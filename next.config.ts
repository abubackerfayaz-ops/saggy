import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve catalogue images straight from the CDN instead of proxying every
    // request through this server's image optimizer (see image-loader.js).
    loader: "custom",
    loaderFile: "./image-loader.js",
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.myntassets.com" },
      { protocol: "https", hostname: "assets.ajio.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.shopify.com" },
      { protocol: "https", hostname: "**.myshopify.com" },
      { protocol: "https", hostname: "fadon.in" },
      { protocol: "https", hostname: "**.fadon.in" },
    ],
  },
};

export default nextConfig;
