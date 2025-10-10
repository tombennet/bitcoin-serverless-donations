import type { Context } from "@netlify/functions";
import { AddressPoolManager } from "../get-address/address-pool.js";
import {
  validateBitcoinEnvironment,
  createValidationErrorResponse,
} from "../shared/validation.js";

export default async (req: Request, context: Context) => {
  try {
    // Validate required environment variables
    const { xpub, derivationPath } = validateBitcoinEnvironment();

    // Initialize address pool manager
    const poolManager = new AddressPoolManager(xpub, derivationPath);

    // Clear the cache
    await poolManager.clearCache();

    return new Response(
      JSON.stringify({
        message: "Cache cleared successfully",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in clear-cache function:", error);

    // Handle validation errors with proper response format
    if (error.message.includes("environment variable is required")) {
      return createValidationErrorResponse(error.message);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
};
