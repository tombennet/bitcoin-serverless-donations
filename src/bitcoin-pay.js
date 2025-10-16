/**
 * Bitcoin Serverless Payments - Client Library
 * A simple, self-custodial solution for accepting private, on-chain Bitcoin payments
 */

import QRCodeStyling from "qr-code-styling";

class BitcoinPay {
  constructor() {
    this.version = "1.0.1";
    this.defaultConfig = {
      width: 200,
      height: 200,
      showCopyButton: true,
      copyButtonText: "Copy",
      copiedText: "Copied!",
      cacheDuration: 10 * 60 * 1000, // 10 minutes
      qrCodeOptions: {
        type: "canvas",
        bitcoinImage:
          "data:image/svg+xml;base64,PHN2ZyB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaGVpZ2h0PSI2NCIgd2lkdGg9IjY0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDA2MzA4NzYsLTAuMDAzMDE5ODQpIj4KPHBhdGggZmlsbD0iI2Y3OTMxYSIgZD0ibTYzLjAzMywzOS43NDRjLTQuMjc0LDE3LjE0My0yMS42MzcsMjcuNTc2LTM4Ljc4MiwyMy4zMDEtMTcuMTM4LTQuMjc0LTI3LjU3MS0yMS42MzgtMjMuMjk1LTM4Ljc4LDQuMjcyLTE3LjE0NSwyMS42MzUtMjcuNTc5LDM4Ljc3NS0yMy4zMDUsMTcuMTQ0LDQuMjc0LDI3LjU3NiwyMS42NCwyMy4zMDIsMzguNzg0eiIvPgo8cGF0aCBmaWxsPSIjRkZGIiBkPSJtNDYuMTAzLDI3LjQ0NGMwLjYzNy00LjI1OC0yLjYwNS02LjU0Ny03LjAzOC04LjA3NGwxLjQzOC01Ljc2OC0zLjUxMS0wLjg3NS0xLjQsNS42MTZjLTAuOTIzLTAuMjMtMS44NzEtMC40NDctMi44MTMtMC42NjJsMS40MS01LjY1My0zLjUwOS0wLjg3NS0xLjQzOSw1Ljc2NmMtMC43NjQtMC4xNzQtMS41MTQtMC4zNDYtMi4yNDItMC41MjdsMC4wMDQtMC4wMTgtNC44NDItMS4yMDktMC45MzQsMy43NXMyLjYwNSwwLjU5NywyLjU1LDAuNjM0YzEuNDIyLDAuMzU1LDEuNjc5LDEuMjk2LDEuNjM2LDIuMDQybC0xLjYzOCw2LjU3MWMwLjA5OCwwLjAyNSwwLjIyNSwwLjA2MSwwLjM2NSwwLjExNy0wLjExNy0wLjAyOS0wLjI0Mi0wLjA2MS0wLjM3MS0wLjA5MmwtMi4yOTYsOS4yMDVjLTAuMTc0LDAuNDMyLTAuNjE1LDEuMDgtMS42MDksMC44MzQsMC4wMzUsMC4wNTEtMi41NTItMC42MzctMi41NTItMC42MzdsLTEuNzQzLDQuMDE5LDQuNTY5LDEuMTM5YzAuODUsMC4yMTMsMS42ODMsMC40MzYsMi41MDMsMC42NDZsLTEuNDUzLDUuODM0LDMuNTA3LDAuODc1LDEuNDM5LTUuNzcyYzAuOTU4LDAuMjYsMS44ODgsMC41LDIuNzk4LDAuNzI2bC0xLjQzNCw1Ljc0NSwzLjUxMSwwLjg3NSwxLjQ1My01LjgyM2M1Ljk4NywxLjEzMywxMC40ODksMC42NzYsMTIuMzg0LTQuNzM5LDEuNTI3LTQuMzYtMC4wNzYtNi44NzUtMy4yMjYtOC41MTUsMi4yOTQtMC41MjksNC4wMjItMi4wMzgsNC40ODMtNS4xNTV6bS04LjAyMiwxMS4yNDljLTEuMDg1LDQuMzYtOC40MjYsMi4wMDMtMTAuODA2LDEuNDEybDEuOTI4LTcuNzI5YzIuMzgsMC41OTQsMTAuMDEyLDEuNzcsOC44NzgsNi4zMTd6bTEuMDg2LTExLjMxMmMtMC45OSwzLjk2Ni03LjEsMS45NTEtOS4wODIsMS40NTdsMS43NDgtNy4wMWMxLjk4MiwwLjQ5NCw4LjM2NSwxLjQxNiw3LjMzNCw1LjU1M3oiLz4KPC9nPgo8L3N2Zz4K",
        lightningImage:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgyIiBoZWlnaHQ9IjI4MiIgdmlld0JveD0iMCAwIDI4MiAyODIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwMCkiPgo8Y2lyY2xlIGN4PSIxNDAuOTgzIiBjeT0iMTQxLjAwMyIgcj0iMTQxIiBmaWxsPSIjN0IxQUY3Ii8+CjxwYXRoIGQ9Ik03OS43NjA5IDE0NC4wNDdMMTczLjc2MSA2My4wNDY2QzE3Ny44NTcgNjAuNDIzNSAxODEuNzYxIDYzLjA0NjYgMTc5LjI2MSA2Ny41NDY2TDE0OS4yNjEgMTI2LjU0N0gyMDIuNzYxQzIwMi43NjEgMTI2LjU0NyAyMTEuMjYxIDEyNi41NDcgMjAyLjc2MSAxMzMuNTQ3TDExMC4yNjEgMjE1LjA0N0MxMDMuNzYxIDIyMC41NDcgOTkuMjYxIDIxNy41NDcgMTAzLjc2MSAyMDkuMDQ3TDEzMi43NjEgMTUxLjU0N0g3OS43NjA5Qzc5Ljc2MDkgMTUxLjU0NyA3MS4yNjA5IDE1MS41NDcgNzkuNzYwOSAxNDQuMDQ3WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMCI+CjxyZWN0IHdpZHRoPSIyODIiIGhlaWdodD0iMjgyIiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=",
      },
    };
  }

  /**
   * Static method to render the Bitcoin donation widget
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - The serverless function endpoint URL
   * @param {string} config.element - CSS selector for the target element
   * @param {string} config.lightning - Optional Lightning address (e.g. "name@provider.com")
   * @param {string} config.fallbackAddress - Fallback on-chain address to use if the serverless function fails
   * @param {Object} config.options - Optional configuration overrides
   */
  static async render(config) {
    const {
      endpoint,
      element,
      lightning,
      fallbackAddress,
      options = {},
    } = config;

    if (!endpoint) {
      throw new Error("BitcoinPay: endpoint is required");
    }

    if (!fallbackAddress) {
      throw new Error("BitcoinPay: fallbackAddress is required");
    }

    if (!element) {
      throw new Error("BitcoinPay: element selector is required");
    }

    const targetElement = document.querySelector(element);
    if (!targetElement) {
      throw new Error(`BitcoinPay: element "${element}" not found`);
    }

    // Create instance for default config and utility methods
    const instance = new BitcoinPay();

    // Merge user options with defaults
    const finalConfig = { ...instance.defaultConfig, ...options };

    // Create unique keys for this instance (for DOM elements)
    const instanceId = instance.generateInstanceId();

    // Create stable cache keys based on endpoint (UTF-8 safe)
    const endpointHash = btoa(unescape(encodeURIComponent(endpoint))).replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    const addressKey = `btc-address-${endpointHash}`;
    const timestampKey = `btc-timestamp-${endpointHash}`;

    try {
      // Get Bitcoin address
      const address = await instance.getBitcoinAddress(
        endpoint,
        addressKey,
        timestampKey,
        finalConfig,
        fallbackAddress
      );

      // Create the widget HTML (single or dual mode)
      const widgetHTML = lightning
        ? instance.createDualWidgetHTML(
            address,
            lightning,
            finalConfig,
            instanceId
          )
        : instance.createSingleWidgetHTML(address, finalConfig, instanceId);
      targetElement.innerHTML = widgetHTML;

      // Initialize QR code and copy functionality
      if (lightning) {
        await instance.initializeDualWidget(
          address,
          lightning,
          finalConfig,
          instanceId
        );
      } else {
        await instance.initializeSingleWidget(address, finalConfig, instanceId);
      }
    } catch (error) {
      console.error("BitcoinPay: Failed to initialize", error);
      targetElement.innerHTML = `<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
        Failed to load Bitcoin payment widget. Please check your configuration.
      </div>`;
    }
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Copy text to clipboard with fallback for insecure origins
   */
  async copyToClipboard(text) {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall back to legacy method
      }
    }

    // Legacy fallback: create temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const success = document.execCommand("copy");
      return success;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Get Bitcoin address with caching
   */
  async getBitcoinAddress(
    endpoint,
    addressKey,
    timestampKey,
    config,
    fallbackAddress
  ) {
    // Validate cache duration (0 to 1 week)
    const validCacheDuration = Math.max(
      0,
      Math.min(config.cacheDuration, 604800000)
    );

    // Check localStorage cache if available
    if (this.isLocalStorageAvailable()) {
      const storedAddress = localStorage.getItem(addressKey);
      const storedTimestamp = localStorage.getItem(timestampKey);

      if (storedAddress && storedTimestamp) {
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        if (now - timestamp < validCacheDuration) {
          return storedAddress;
        }
      }
    }

    // Fetch from server if no valid cache
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.address) {
        throw new Error("Invalid response: no address field");
      }

      // Store in cache if localStorage is available
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(addressKey, data.address);
        localStorage.setItem(timestampKey, Date.now().toString());
      }
      return data.address;
    } catch (err) {
      console.error("Failed to fetch Bitcoin address", err);
      if (fallbackAddress) {
        return fallbackAddress;
      }
      throw new Error(`Failed to fetch Bitcoin address: ${err.message}`);
    }
  }

  /**
   * Create the single Bitcoin widget HTML structure
   */
  createSingleWidgetHTML(address, config, instanceId) {
    const qrContainerId = `btc-qr-${instanceId}`;
    const buttonId = `btc-btn-${instanceId}`;

    return `
      <div class="bitcoin-pay-widget">
        <div class="widget-layout">
          <div id="${qrContainerId}" class="qr-container"></div>
          <div class="content-area">
            <p class="description">
              Scan with your Bitcoin wallet, or copy the on-chain address below.
            </p>
            <div class="address-container">
              <div class="address-text">
                <span>${address}</span>
              </div>
              ${
                config.showCopyButton
                  ? `<button id="${buttonId}" class="copy-btn">${config.copyButtonText}</button>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create the dual Bitcoin/Lightning widget HTML structure
   */
  createDualWidgetHTML(address, lightning, config, instanceId) {
    const bitcoinQrId = `btc-qr-${instanceId}`;
    const lightningQrId = `lightning-qr-${instanceId}`;
    const bitcoinBtnId = `btc-btn-${instanceId}`;
    const lightningBtnId = `lightning-btn-${instanceId}`;

    return `
      <div class="bitcoin-pay-widget has-tabs">
        <div class="widget-content">
          <!-- Tab Navigation -->
          <div class="tab-navigation">
            <button id="bitcoin-tab-${instanceId}" class="tab-btn active" data-tab="bitcoin">
              <svg width="20" height="20" viewBox="0 0 64 64" fill="currentColor">
                <g transform="translate(0.00630876,-0.00301984)">
                  <path d="m63.033,39.744c-4.274,17.143-21.637,27.576-38.782,23.301-17.138-4.274-27.571-21.638-23.295-38.78,4.272-17.145,21.635-27.579,38.775-23.305,17.144,4.274,27.576,21.64,23.302,38.784z"/>
                  <path fill="#FFF" d="m46.103,27.444c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.022,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.990,3.966-7.1,1.951-9.082,1.457l1.748-7.01c1.982,0.494,8.365,1.416,7.334,5.553z"/>
                </g>
              </svg>
              Bitcoin
            </button>
            <button id="lightning-tab-${instanceId}" class="tab-btn" data-tab="lightning">
              <svg width="20" height="20" viewBox="0 0 282 282" fill="currentColor">
                <g clip-path="url(#clip0)">
                  <circle cx="140.983" cy="141.003" r="141" />
                  <path d="M79.7609 144.047L173.761 63.0466C177.857 60.4235 181.761 63.0466 179.261 67.5466L149.261 126.547H202.761C202.761 126.547 211.261 126.547 202.761 133.547L110.261 215.047C103.761 220.547 99.261 217.547 103.761 209.047L132.761 151.547H79.7609C79.7609 151.547 71.2609 151.547 79.7609 144.047Z" fill="white"/>
                </g>
                <defs>
                  <clipPath id="clip0">
                    <rect width="282" height="282" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              Lightning
            </button>
          </div>

          <!-- Bitcoin Tab Content -->
          <div id="bitcoin-content-${instanceId}" class="tab-content active" data-tab="bitcoin">
            <div class="widget-layout">
              <div id="${bitcoinQrId}" class="qr-container"></div>
              <div class="content-area">
                <p class="description">
                  Scan with your Bitcoin wallet, or copy the on-chain address below.
                </p>
                <div class="address-container">
                  <div class="address-text">
                    <span>${address}</span>
                  </div>
                  ${
                    config.showCopyButton
                      ? `<button id="${bitcoinBtnId}" class="copy-btn">${config.copyButtonText}</button>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Lightning Tab Content -->
          <div id="lightning-content-${instanceId}" class="tab-content" data-tab="lightning">
            <div class="widget-layout">
              <div id="${lightningQrId}" class="qr-container"></div>
              <div class="content-area">
                <p class="description">
                  Scan with your Lightning wallet, or copy my Lightning address below.
                </p>
                <div class="address-container">
                  <div class="address-text">
                    <span>${lightning}</span>
                  </div>
                  ${
                    config.showCopyButton
                      ? `<button id="${lightningBtnId}" class="copy-btn">Copy</button>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize single Bitcoin widget
   */
  async initializeSingleWidget(address, config, instanceId) {
    const qrContainerId = `btc-qr-${instanceId}`;
    const buttonId = `btc-btn-${instanceId}`;

    // Render QR code
    const qrCode = new QRCodeStyling({
      width: config.width,
      height: config.height,
      type: config.qrCodeOptions.type,
      data: `bitcoin:${address}`,
      image: config.qrCodeOptions.bitcoinImage,
    });

    const qrContainer = document.getElementById(qrContainerId);
    if (qrContainer) {
      qrCode.append(qrContainer);
    }

    // Initialize copy button
    if (config.showCopyButton) {
      const copyButton = document.getElementById(buttonId);
      if (copyButton) {
        copyButton.addEventListener("click", async () => {
          const success = await this.copyToClipboard(address);
          const originalText = copyButton.textContent;

          if (success) {
            copyButton.textContent = config.copiedText;
          } else {
            copyButton.textContent = "Failed to copy";
          }

          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        });
      }
    }
  }

  /**
   * Initialize dual Bitcoin/Lightning widget
   */
  async initializeDualWidget(address, lightning, config, instanceId) {
    const bitcoinQrId = `btc-qr-${instanceId}`;
    const lightningQrId = `lightning-qr-${instanceId}`;
    const bitcoinBtnId = `btc-btn-${instanceId}`;
    const lightningBtnId = `lightning-btn-${instanceId}`;

    // Render Bitcoin QR code
    const bitcoinQrCode = new QRCodeStyling({
      width: config.width,
      height: config.height,
      type: config.qrCodeOptions.type,
      data: `bitcoin:${address}`,
      image: config.qrCodeOptions.bitcoinImage,
    });

    const bitcoinQrContainer = document.getElementById(bitcoinQrId);
    if (bitcoinQrContainer) {
      bitcoinQrCode.append(bitcoinQrContainer);
    }

    // Render Lightning QR code
    const lightningQrCode = new QRCodeStyling({
      width: config.width,
      height: config.height,
      type: config.qrCodeOptions.type,
      data: `lightning:${lightning}`,
      image: config.qrCodeOptions.lightningImage,
    });

    const lightningQrContainer = document.getElementById(lightningQrId);
    if (lightningQrContainer) {
      lightningQrCode.append(lightningQrContainer);
    }

    // Initialize tab switching
    this.setupTabs(instanceId);

    // Initialize copy buttons
    if (config.showCopyButton) {
      // Bitcoin copy button
      const bitcoinCopyButton = document.getElementById(bitcoinBtnId);
      if (bitcoinCopyButton) {
        bitcoinCopyButton.addEventListener("click", async () => {
          const success = await this.copyToClipboard(address);
          const originalText = bitcoinCopyButton.textContent;

          if (success) {
            bitcoinCopyButton.textContent = config.copiedText;
          } else {
            bitcoinCopyButton.textContent = "Failed to copy";
          }

          setTimeout(() => {
            bitcoinCopyButton.textContent = originalText;
          }, 2000);
        });
      }

      // Lightning copy button
      const lightningCopyButton = document.getElementById(lightningBtnId);
      if (lightningCopyButton) {
        lightningCopyButton.addEventListener("click", async () => {
          const success = await this.copyToClipboard(lightning);
          const originalText = lightningCopyButton.textContent;

          if (success) {
            lightningCopyButton.textContent = config.copiedText;
          } else {
            lightningCopyButton.textContent = "Failed to copy";
          }

          setTimeout(() => {
            lightningCopyButton.textContent = originalText;
          }, 2000);
        });
      }
    }
  }

  /**
   * Setup tab switching functionality
   */
  setupTabs(instanceId) {
    const tabButtons = document.querySelectorAll(
      `.tab-btn[id$="-${instanceId}"]`
    );
    const tabContents = document.querySelectorAll(
      `.tab-content[id$="-${instanceId}"]`
    );

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");

        // Update button states
        tabButtons.forEach((b) => {
          b.classList.remove("active");
        });
        btn.classList.add("active");

        // Show/hide content
        tabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.getAttribute("data-tab") === targetTab) {
            content.classList.add("active");
          }
        });
      });
    });
  }

  /**
   * Generate unique instance ID
   */
  generateInstanceId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Make available globally for script tag usage
if (typeof window !== "undefined") {
  window.BitcoinPay = BitcoinPay;
}

// ESM exports
export { BitcoinPay };
export default BitcoinPay;
