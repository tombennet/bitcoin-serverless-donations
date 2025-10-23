import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { minify } from "terser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cssnano from "cssnano";
import postcss from "postcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function build() {
  try {
    console.log("Building Bitcoin Serverless Payments...");

    // Ensure dist directory exists
    const distDir = join(__dirname, "dist");
    try {
      mkdirSync(distDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Read the source file
    const sourcePath = join(__dirname, "src", "bitcoin-pay.js");
    let sourceCode = readFileSync(sourcePath, "utf8");
    // Inline logo SVGs as data URIs via placeholder replacement
    const btcSvg = readFileSync(
      join(__dirname, "src", "img", "bitcoin.svg"),
      "utf8"
    );
    const ltgSvg = readFileSync(
      join(__dirname, "src", "img", "lightning.svg"),
      "utf8"
    );
    const btcDataUri = `data:image/svg+xml;base64,${Buffer.from(
      btcSvg,
      "utf8"
    ).toString("base64")}`;
    const ltgDataUri = `data:image/svg+xml;base64,${Buffer.from(
      ltgSvg,
      "utf8"
    ).toString("base64")}`;
    sourceCode = sourceCode
      .replace(/__BITCOIN_LOGO__/g, btcDataUri)
      .replace(/__LIGHTNING_LOGO__/g, ltgDataUri);

    // ===== PREPARE BUNDLED CODE =====
    console.log("📦 Bundling dependencies...");

    // Read the vendored QR code generator and local svg util
    const qrVendorPath = join(
      __dirname,
      "src",
      "vendor",
      "qrcode-generator.js"
    );
    const qrVendorRaw = readFileSync(qrVendorPath, "utf8");
    // Strip ESM exports for bundling
    const qrVendor = qrVendorRaw
      .replace(/\nexport\s+\{[^}]*\};?/g, "")
      .replace(/\nexport\s+default\s+[^;]+;?/g, "");

    const qrUtilPath = join(__dirname, "src", "qr.js");
    const qrUtilRaw = readFileSync(qrUtilPath, "utf8");
    // Transform ESM util to plain script for bundling
    const qrUtil = qrUtilRaw
      .replace(
        /import\s+qrcode\s+from\s+\"\.\/vendor\/qrcode-generator\.js\";\n?/,
        ""
      )
      .replace(
        /export\s+function\s+generateQrSvg\s*\(/,
        "function generateQrSvg("
      )
      .replace(/\nexport\s+default\s+generateQrSvg;?\n?/, "\n");

    // Remove the ES module import from main source
    const coreSourceCode = sourceCode.replace(
      /import\s+generateQrSvg.*?from\s+\"\.\/qr\.js\";\n?/,
      ""
    );

    // ===== CDN BUILD (Bundled, no exports) =====
    console.log("📦 Building CDN version (bundled)...");

    // Remove ESM exports for CDN version
    const cdnSourceCode = coreSourceCode.replace(
      /\/\/ ESM exports\nexport\s*\{[^}]*\};\nexport\s+default\s+\w+;\s*$/,
      ""
    );

    // Create the bundled code for CDN
    const cdnBundledCode = `
      // qrcode-generator (vendored)
      ${qrVendor}

      // qr svg util
      ${qrUtil}

      // Bitcoin Donate Library
      ${cdnSourceCode}
      `;

    console.log("🔧 Minifying CDN version with Terser...");
    const cdnMinifyResult = await minify(cdnBundledCode, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        reserved: ["BitcoinPay", "render"],
      },
      format: {
        comments: false,
      },
    });

    if (cdnMinifyResult.error) {
      throw cdnMinifyResult.error;
    }

    // Write CDN minified file
    const cdnOutputPath = join(distDir, "bitcoin-pay.min.js");
    writeFileSync(cdnOutputPath, cdnMinifyResult.code, "utf8");

    // ===== ESM BUILD (Bundled with exports) =====
    console.log("📦 Building ESM version (bundled)...");

    // Create the bundled code for ESM (keep exports)
    const esmBundledCode = `
      // qrcode-generator (vendored)
      ${qrVendor}

      // qr svg util
      ${qrUtil}

      // Bitcoin Donate Library
      ${coreSourceCode}
      `;

    const esmMinifyResult = await minify(esmBundledCode, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        reserved: ["BitcoinPay", "render"],
      },
      format: {
        comments: false,
      },
    });

    if (esmMinifyResult.error) {
      throw esmMinifyResult.error;
    }

    // Write ESM minified file
    const esmOutputPath = join(distDir, "bitcoin-pay.esm.js");
    writeFileSync(esmOutputPath, esmMinifyResult.code, "utf8");

    // ===== CSS BUILD =====
    console.log("🎨 Minifying CSS file...");
    const cssSource = join(__dirname, "src", "bitcoin-pay.css");
    const cssDest = join(distDir, "bitcoin-pay.min.css");
    const cssContent = readFileSync(cssSource, "utf8");

    const cssResult = await postcss([cssnano()]).process(cssContent, {
      from: cssSource,
      to: cssDest,
    });

    writeFileSync(cssDest, cssResult.css, "utf8");

    // ===== OUTPUT SUMMARY =====
    console.log(`✅ Built successfully:`);
    console.log(
      `   📦 CDN JavaScript: ${cdnOutputPath} (${(
        cdnMinifyResult.code.length / 1024
      ).toFixed(2)} KB)`
    );
    console.log(
      `   📦 ESM JavaScript: ${esmOutputPath} (${(
        esmMinifyResult.code.length / 1024
      ).toFixed(2)} KB)`
    );
    const minifiedCssSize = (cssResult.css.length / 1024).toFixed(2);
    console.log(`   🎨 CSS: ${cssDest} (${minifiedCssSize} KB)`);

    // Show size comparison
    const originalJsSize = (
      readFileSync(join(__dirname, "src", "bitcoin-pay.js"), "utf8").length /
      1024
    ).toFixed(2);
    const originalCssSize = (cssContent.length / 1024).toFixed(2);
    const cdnJsSize = (cdnMinifyResult.code.length / 1024).toFixed(2);
    const esmJsSize = (esmMinifyResult.code.length / 1024).toFixed(2);

    console.log(
      `   📊 CDN JavaScript: ${originalJsSize} KB → ${cdnJsSize} KB (bundled, no exports)`
    );
    console.log(
      `   📊 ESM JavaScript: ${originalJsSize} KB → ${esmJsSize} KB (bundled, with exports)`
    );
    console.log(`   📊 CSS: ${originalCssSize} KB → ${minifiedCssSize} KB`);
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
