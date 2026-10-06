import type { Metadata, Viewport } from "next";
import {
  Black_Han_Sans,
  Russo_One,
  Anton,
  Barlow_Condensed,
  Exo_2,
  Orbitron,
  Rajdhani,
  Playfair_Display,
  Teko,
  DM_Sans,
} from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";

// Might / Skybold / Victory match — ultra-bold Korean-inspired block caps
// Used for: SAGGY logo wordmark
const blackHanSans = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-logo",
});

// Victory Striker / Marathon match — solid athletic slab
// Used for: Hero headline, big display text
const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-hero",
});

// Merca / Death Craft match — thick bold condensed impact
// Used for: Section headings (Trending, Shop by Price, etc.)
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-heading",
});

// CHORUS / Condenso match — tight condensed grotesk
// Used for: Navbar, category pills, tags, labels
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-pill",
});

// Havock / Zariantz Grotesk match — geometric techy sans
// Used for: Product card names, body copy
const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-product",
});

// HIDROM / Neuronicle match — futuristic space-age mono-ish
// Used for: Prices, numbers, quantities
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-price",
});

// Lokanova Pro match — sharp military stencil-adjacent sans
// Used for: Category names, uppercase labels, stat numbers
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-label",
});

// Cuturila / Pemage match — dramatic editorial serif
// Used for: Pull-quotes, italic accents
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-accent",
});

// Climax match — bold condensed multi-weight display
// Used for: Buttons, CTAs
const teko = Teko({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cta",
});

// Clean geometric — fine print, meta, descriptions
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "SAGGY | Curated Fashion with Transparent Pricing",
  description:
    "Discover trending men's shirts curated from top fashion sources. Casual, Formal, Linen, Oversized shirts at the lowest price.",
  keywords: [
    "shirts",
    "men shirts",
    "casual shirts",
    "formal shirts",
    "oversized shirts",
    "linen shirts",
    "SAGGY",
    "fashion marketplace india",
  ],
  authors: [{ name: "SAGGY Curated Fashion" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`
        ${blackHanSans.variable}
        ${russoOne.variable}
        ${anton.variable}
        ${barlowCondensed.variable}
        ${exo2.variable}
        ${orbitron.variable}
        ${rajdhani.variable}
        ${playfair.variable}
        ${teko.variable}
        ${dmSans.variable}
        h-full antialiased
      `}
    >
      <body
        className="min-h-full flex flex-col bg-[#070709] text-[#EDEDED] selection:bg-[#FF2D88] selection:text-white antialiased relative"
        style={{ fontFamily: 'var(--font-body), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      >
        {/* Ambient Top Glow matching pink flame logo */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[320px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,45,136,0.12),transparent_70%)] pointer-events-none z-0" />
        <CartProvider>
          <Navbar />
          <main className="flex-1 w-full relative z-10">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

