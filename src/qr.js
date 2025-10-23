import qrcode from "./vendor/qrcode-generator.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function generateQrSvg(options) {
  const {
    text,
    size = 200,
    ecc = "H", // 'L' | 'M' | 'Q' | 'H'
    marginModules = 3,
    dark = "#000000",
    light = "#ffffff",
    logoHref,
    logoSizeRatio = 0.2, // fraction of full size
    logoBgPaddingRatio = 0.01, // padding around logo as fraction of full size
    title,
    alt,
  } = options || {};

  if (!text || typeof text !== "string") {
    throw new Error("generateQrSvg: 'text' is required");
  }

  const qr = qrcode(0, ecc);
  qr.addData(text, "Byte");
  qr.make();

  const moduleCount = qr.getModuleCount();
  const margin = Math.max(0, Math.floor(marginModules));
  const totalModules = moduleCount + margin * 2;

  // Force a stable outer size by using fractional cell size and rounding positions
  const cellSize = size / totalModules;
  const pixelSize = size;

  // Build path for dark modules
  const rectCmd = `l${cellSize},0 0,${cellSize} -${cellSize},0 0,-${cellSize}z`;
  let path = "";
  for (let r = 0; r < moduleCount; r++) {
    const y = r * cellSize + margin * cellSize;
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        const x = c * cellSize + margin * cellSize;
        path += `M${x},${y}${rectCmd}`;
      }
    }
  }

  const ariaIds = {
    titleId: title ? "qrcode-title" : null,
    descId: alt ? "qrcode-description" : null,
  };

  let svg = "";
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}px" height="${pixelSize}px" viewBox="0 0 ${pixelSize} ${pixelSize}" preserveAspectRatio="none"`;
  if (title || alt) {
    const labelledBy = [ariaIds.titleId, ariaIds.descId]
      .filter(Boolean)
      .join(" ");
    svg += ` role="img" aria-labelledby="${labelledBy}"`;
  }
  svg += ">";
  if (title)
    svg += `<title id="${ariaIds.titleId}">${escapeXml(title)}</title>`;
  if (alt)
    svg += `<description id="${ariaIds.descId}">${escapeXml(
      alt
    )}</description>`;
  svg += `<rect width="100%" height="100%" fill="${light}"/>`;
  svg += `<path d="${path}" fill="${dark}"/>`;

  if (logoHref) {
    const clampedLogoRatio = clamp(logoSizeRatio, 0.08, 0.25);
    const clampedPadRatio = clamp(logoBgPaddingRatio, 0, 0.08);

    const logoSizePx = pixelSize * clampedLogoRatio;
    const logoPadPx = pixelSize * clampedPadRatio;
    const cx = pixelSize / 2;
    const cy = pixelSize / 2;
    const imgX = cx - logoSizePx / 2;
    const imgY = cy - logoSizePx / 2;

    const r = logoSizePx / 2 + logoPadPx;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>`;
    svg += `<image href="${logoHref}" x="${imgX}" y="${imgY}" width="${logoSizePx}" height="${logoSizePx}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  svg += `</svg>`;
  return svg;
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export default generateQrSvg;
