/**
 * Bitcoin Serverless Payments - TypeScript Definitions
 */

/**
 * Configuration options for customizing the widget appearance and behavior
 */
export interface BitcoinPayOptions {
  /** Width of the QR code in pixels */
  width?: number;
  /** Height of the QR code in pixels */
  height?: number;
  /** Whether to show the copy button */
  showCopyButton?: boolean;
  /** Text displayed on the copy button */
  copyButtonText?: string;
  /** Text displayed when address is copied */
  copiedText?: string;
  /** Cache duration in milliseconds (0 to 1 week) */
  cacheDuration?: number;
  /** QR code configuration options */
  qrCodeOptions?: {
    /** Error correction level: 'L' | 'M' | 'Q' | 'H' */
    ecc?: "L" | "M" | "Q" | "H";
    /** Logo to display in QR code center */
    logo?: "btc" | "lightning" | undefined;
    /** Bitcoin logo image data URL */
    bitcoinImage?: string;
    /** Lightning logo image data URL */
    lightningImage?: string;
  };
}

/**
 * Configuration for rendering the Bitcoin payment widget
 */
export interface BitcoinPayConfig {
  /** CSS selector for the target element(s) (e.g., "#bitcoin-donate" or ".donation-widget") */
  selector: string;
  /** The serverless function endpoint URL */
  endpoint: string;
  /** Fallback on-chain address to use if the serverless function fails */
  fallbackAddress: string;
  /** Optional Lightning address (e.g., "name@provider.com") */
  lightning?: string;
  /** Optional custom text to display above the Bitcoin address field */
  bitcoinDonateText?: string;
  /** Optional custom text to display above the Lightning address field */
  lightningDonateText?: string;
  /** Optional configuration overrides */
  options?: BitcoinPayOptions;
}

/**
 * Result of a successful widget render
 */
export interface RenderSuccess {
  success: true;
  element: Element;
}

/**
 * Result types from Promise.allSettled
 */
export type RenderResult =
  | { status: "fulfilled"; value: RenderSuccess }
  | { status: "rejected"; reason: Error };

/**
 * Bitcoin Serverless Payments Widget
 */
export class BitcoinPay {
  /** Library version */
  readonly version: string;

  /**
   * Render the Bitcoin donation widget
   * @param config - Configuration object
   * @returns Promise that resolves to an array of results for each matched element
   * @throws Error if required parameters are missing or no elements match the selector
   */
  static render(config: BitcoinPayConfig): Promise<RenderResult[]>;

  constructor();
}

/**
 * Default export
 */
export default BitcoinPay;

/**
 * Global declaration for script tag usage
 */
declare global {
  interface Window {
    BitcoinPay: typeof BitcoinPay;
  }
}
