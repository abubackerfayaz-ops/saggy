/**
 * One-shot asset optimizer: shrinks the brand logo and UPI QR so the
 * storefront ships kilobytes instead of hundreds of kilobytes.
 *
 *   node scripts/optimize-assets.mjs
 *
 * Inputs  public/saggy-logo.png (861x284, alpha)  -> src/assets/saggy-logo.webp (320w)
 *         public/qr-payment.png (799x1024)        -> src/assets/qr-payment.png  (416x416, QR crop)
 */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

const LOGO_IN = "public/saggy-logo.png";
const LOGO_OUT = "src/assets/saggy-logo.webp";
const QR_IN = "public/qr-payment.png";
const QR_OUT = "src/assets/qr-payment.png";

// The QR code sits inside the card at roughly x 155-645, y 210-700 of the
// 799x1024 original. Crop a padded square around it (stopping short of the
// "Scan to pay" caption), then scale to the 2x display size (208px * 2 = 416).
const QR_CROP = { left: 135, top: 185, width: 530, height: 530 };
const QR_SIZE = 416;

async function kb(file) {
  const { size } = await stat(file);
  return `${(size / 1024).toFixed(1)} KB`;
}

async function main() {
  await mkdir("src/assets", { recursive: true });

  await sharp(LOGO_IN)
    .resize({ width: 320, withoutEnlargement: true })
    .webp({ quality: 75, alphaQuality: 85 })
    .toFile(LOGO_OUT);

  await sharp(QR_IN)
    .extract(QR_CROP)
    .resize(QR_SIZE, QR_SIZE, { kernel: "lanczos3" })
    .png({ compressionLevel: 9, palette: true, quality: 100, dither: 0 })
    .toFile(QR_OUT);

  console.log(`logo: ${LOGO_IN} -> ${LOGO_OUT} (${await kb(LOGO_OUT)})`);
  console.log(`qr:   ${QR_IN} -> ${QR_OUT} (${await kb(QR_OUT)})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
