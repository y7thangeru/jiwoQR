export * from './types.js';
export * from './dna/hasher.js';
export * from './dna/prng.js';
export * from './dna/generator.js';
export * from './qr/encoder.js';
export * from './qr/reed-solomon.js';
export * from './qr/tables.js';

import { EncodeOptions, JiwoQREntity } from './types.js';
import { normalizeInput } from './dna/hasher.js';
import { generateDNA } from './dna/generator.js';
import { encodeQR } from './qr/encoder.js';

/**
 * Unified high-level entry to create a complete JiwoQREntity
 * containing both the semantic QR bit matrix and the deterministic visual DNA.
 */
export function createJiwoQR(input: string, options?: EncodeOptions): JiwoQREntity {
  const normalized = normalizeInput(input);
  const dna = generateDNA(normalized);
  const matrix = encodeQR(normalized, options);
  return { matrix, dna };
}
