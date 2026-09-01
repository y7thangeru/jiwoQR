/**
 * 64-bit FNV-1a hashing function for deterministic visual DNA.
 * Provides high avalanche effect and uniform distribution across 64 bits.
 */
const FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

export function fnv1a64(input: string): bigint {
  let hash = FNV_OFFSET_BASIS_64;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);

  for (let i = 0; i < bytes.length; i++) {
    hash ^= BigInt(bytes[i]);
    hash = (hash * FNV_PRIME_64) & MASK_64;
  }

  return hash;
}

/**
 * Normalizes input string (URLs are lowercased by scheme/host, trimmed, trailing slashes handled).
 */
export function normalizeInput(input: string): string {
  const trimmed = input.trim();
  try {
    const parsed = new URL(trimmed);
    // Standardize URL protocol and hostname to lowercase
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    // Remove default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }
    return parsed.toString();
  } catch {
    // Non-URL raw text payloads
    return trimmed;
  }
}
