/**
 * Validates required environment variables for Bitcoin address functions
 * @returns Object containing validated xpub and derivationPath, or throws error
 */
export function validateBitcoinEnvironment(): {
  xpub: string;
  derivationPath: string;
} {
  const xpub = process.env.BITCOIN_XPUB;
  const derivationPath = process.env.BITCOIN_DERIVATION_PATH;

  if (!xpub) {
    throw new Error("BITCOIN_XPUB environment variable is required");
  }

  if (!derivationPath) {
    throw new Error("BITCOIN_DERIVATION_PATH environment variable is required");
  }

  // Validate that derivation path is at account level (ends with hardened derivation)
  // Expected format: m/purpose'/coin'/account' (e.g., m/84'/0'/0')
  // This path is used for purpose detection only - the XPUB should be at account level
  if (!derivationPath.match(/^m\/\d+'\/\d+'\/\d+'$/)) {
    throw new Error(
      "BITCOIN_DERIVATION_PATH must be at account level (e.g., m/84'/0'/0'). " +
        "This is used for purpose detection - the XPUB should be at the same account level."
    );
  }

  return { xpub, derivationPath };
}

/**
 * Creates a standardized error response for validation failures
 * @param message Error message
 * @returns Response object
 */
export function createValidationErrorResponse(message: string): Response {
  return new Response(message, {
    status: 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}
