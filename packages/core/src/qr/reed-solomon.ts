/**
 * Galois Field GF(256) arithmetic and Reed-Solomon error correction for QR codes.
 * Primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1 = 0x11d (285).
 */
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

// Initialize logarithm and exponent tables for GF(256)
(function initGF256() {
  let value = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = value;
    EXP_TABLE[i + 255] = value;
    LOG_TABLE[value] = i;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }
  LOG_TABLE[0] = 0; // log(0) is undefined, set 0 as sentinel
})();

export function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

/**
 * Generates the generator polynomial of degree `degree`.
 * g(x) = (x - α^0)(x - α^1)...(x - α^(degree-1))
 */
export function getGeneratorPolynomial(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);

  for (let i = 0; i < degree; i++) {
    const factor = new Uint8Array([1, EXP_TABLE[i]]);
    const nextPoly = new Uint8Array(poly.length + 1);

    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        nextPoly[j + k] ^= gfMultiply(poly[j], factor[k]);
      }
    }
    poly = nextPoly;
  }

  return poly;
}

/**
 * Calculates Reed-Solomon error correction codewords for a given data block.
 * Divides data poly * x^eccCount by generator polynomial.
 */
export function calculateECC(data: Uint8Array, eccCount: number): Uint8Array {
  const generator = getGeneratorPolynomial(eccCount);
  const remainder = new Uint8Array(eccCount);

  // Load message into remainder buffer
  const working = new Uint8Array(data.length + eccCount);
  working.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const leadCoeff = working[i];
    if (leadCoeff !== 0) {
      for (let j = 0; j < generator.length; j++) {
        working[i + j] ^= gfMultiply(generator[j], leadCoeff);
      }
    }
  }

  remainder.set(working.subarray(data.length));
  return remainder;
}
