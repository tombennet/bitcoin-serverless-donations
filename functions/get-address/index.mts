import type { Context } from "@netlify/functions";
import { addresses } from "./addresses.js";
import { createHash } from "crypto";

function hashToInt(input: string) {
  const hash = createHash("sha256").update(input).digest();
  return hash.readUInt32BE(0);
}

export default async (req: Request, context: Context) => {
  try {
    const unusedAddresses = addresses.filter((addr) => !addr.used);
    if (unusedAddresses.length < 1) {
      return new Response("I'm fresh out of Bitcoin addresses.", {
        status: 503,
      });
    }

    const ip = context.ip || "unknown";
    const city = context.geo.city || "unknown";
    const today = new Date().toISOString().slice(0, 10);
    const fingerprint = `${ip}|${city}|${today}`;
    const clientOffset = hashToInt(fingerprint) % unusedAddresses.length;

    const address = unusedAddresses[clientOffset].address;

    return new Response(JSON.stringify({ address }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response("Internal server error", { status: 500 });
  }
};
