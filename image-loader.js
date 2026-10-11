"use client";

/**
 * Custom next/image loader.
 *
 * The default Next.js optimizer proxies every remote image through this
 * server. Our catalogue images live on Shopify CDN as multi-megabyte
 * originals, so each cache miss meant downloading + re-encoding ~1.6 MB on a
 * 0.1 CPU instance — and every optimized byte counted against Render's 5 GB
 * monthly outbound bandwidth.
 *
 * This loader asks the CDN for the exact width instead, so the browser talks
 * straight to the CDN (1-year cacheable) and Render never serves image bytes.
 *
 * @param {{ src: string, width: number, quality?: number }} params
 * @returns {string}
 */
export default function saggyImageLoader({ src, width, quality }) {
  // Local / pre-hashed assets are already exported at the right size.
  if (src.startsWith("/") || src.startsWith("data:")) return src;

  let url;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  const host = url.hostname.toLowerCase();

  // Shopify CDN supports native resizing via `?width=`.
  if (
    host === "cdn.shopify.com" ||
    host.endsWith(".shopify.com") ||
    host.endsWith(".myshopify.com")
  ) {
    url.searchParams.set("width", String(width));
    return url.href;
  }

  // Unsplash serves auto-format (WebP/AVIF) images resized via `w`.
  if (host === "images.unsplash.com" || host.endsWith(".unsplash.com")) {
    url.searchParams.set("auto", "format");
    url.searchParams.set("w", String(width));
    if (quality) url.searchParams.set("q", String(quality));
    return url.href;
  }

  // Unknown host: fall back to the original URL so images never break.
  return src;
}
