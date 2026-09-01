/**
 * Mulberry32 pseudo-random number generator.
 * Fast, 32-bit state, deterministic, with excellent statistical distribution.
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number | bigint) {
    if (typeof seed === 'bigint') {
      // Safe 32-bit conversion to prevent runtime TypeError during bitwise operations
      this.state = Number(BigInt.asUintN(32, seed));
    } else {
      this.state = seed >>> 0;
    }
  }

  /** Returns uniform pseudo-random float in [0, 1) */
  next(): number {
    let z = (this.state = (this.state + 0x6d2b79f5) | 0);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns pseudo-random float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns pseudo-random integer in [min, max] inclusive */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** Picks an element from an array deterministically */
  choice<T>(items: readonly T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }
}
