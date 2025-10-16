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

    // ===== CDN BUILD (Bundled) =====
    console.log("📦 Building CDN version (bundled)...");

    // Read the QR code library from node_modules
    const qrCodePath = join(
      __dirname,
      "node_modules",
      "qr-code-styling",
      "lib",
      "qr-code-styling.js"
    );
    const qrCodeLibrary = readFileSync(qrCodePath, "utf8");

    // Remove the ES module import and exports for CDN version
    const cdnSourceCode = sourceCode
      .replace(/import\s+QRCodeStyling.*?;\n?/, "")
      .replace(
        /\/\/ ESM exports\nexport\s*\{[^}]*\};\nexport\s+default\s+\w+;\s*$/,
        ""
      );

    // Create the bundled code for CDN
    const bundledCode = `
      (() => {
      // QR Code Styling Library
      ${qrCodeLibrary}
      })();

      // Bitcoin Donate Library
      ${cdnSourceCode}
      `;

    console.log("🔧 Minifying CDN version with Terser...");
    const cdnMinifyResult = await minify(bundledCode, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        reserved: ["BitcoinPay", "render", "QRCodeStyling"],
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

    // ===== ESM BUILD (Unbundled) =====
    console.log("📦 Building ESM version (unbundled)...");

    // For ESM, we keep the original source with imports intact
    // Just minify it without bundling dependencies
    const esmMinifyResult = await minify(sourceCode, {
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
      `   📊 CDN JavaScript: ${originalJsSize} KB → ${cdnJsSize} KB (includes QR library)`
    );
    console.log(
      `   📊 ESM JavaScript: ${originalJsSize} KB → ${esmJsSize} KB (tree-shakeable)`
    );
    console.log(`   📊 CSS: ${originalCssSize} KB → ${minifiedCssSize} KB`);
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
