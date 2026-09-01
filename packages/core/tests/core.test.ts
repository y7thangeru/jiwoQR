import { describe, it, expect } from 'vitest';
import {
  fnv1a64,
  normalizeInput,
  Mulberry32,
  generateDNA,
  encodeQR,
  createJiwoQR,
  calculateECC,
} from '../src/index.js';

describe('@jiwoqr/core', () => {
  describe('Input Normalization & Hasher', () => {
    it('normalizes URLs predictably', () => {
      const url1 = 'https://Example.COM:443/Path/To/Page';
      const url2 = 'https://example.com/Path/To/Page';
      expect(normalizeInput(url1)).toBe(normalizeInput(url2));
    });

    it('generates deterministic 64-bit bigint hashes', () => {
      const hash1 = fnv1a64('https://jiwoqr.dev');
      const hash2 = fnv1a64('https://jiwoqr.dev');
      const hash3 = fnv1a64('https://jiwoqr.dev/different');

      expect(typeof hash1).toBe('bigint');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Deterministic DNA & PRNG', () => {
    it('safely converts BigInt to 32-bit uint in Mulberry32 PRNG', () => {
      const bigSeed = 0x123456789abcdef0n;
      const rng1 = new Mulberry32(bigSeed);
      const val1 = rng1.next();
      const val2 = rng1.next();

      expect(typeof val1).toBe('number');
      expect(val1).toBeGreaterThanOrEqual(0);
      expect(val1).toBeLessThan(1);
      expect(val1).not.toBe(val2);

      // Reproducibility with same bigint
      const rng2 = new Mulberry32(bigSeed);
      expect(rng2.next()).toBe(val1);
      expect(rng2.next()).toBe(val2);
    });

    it('generates fully deterministic visual DNA from input', () => {
      const input = 'https://github.com/AlbertAZ1992/every-qrcode';
      const dna1 = generateDNA(input);
      const dna2 = generateDNA(input);

      expect(dna1.seed32).toBe(dna2.seed32);
      expect(dna1.palette).toEqual(dna2.palette);
      expect(dna1.architecture).toEqual(dna2.architecture);
      expect(dna1.globe).toEqual(dna2.globe);
      expect(dna1.circuit).toEqual(dna2.circuit);

      // Verify architecture properties
      expect(dna1.architecture.maxHeight).toBeGreaterThan(0);
      expect(['flat', 'stepped', 'sloped', 'spire']).toContain(dna1.architecture.roofStyle);
      expect(['monolith', 'citadel', 'obelisk', 'pagoda']).toContain(
        dna1.architecture.towerArchetype
      );

      // Verify circuit properties
      expect(['orthogonal', 'diagonal', 'curved']).toContain(dna1.circuit.traceStyle);
      expect(['qfp', 'bga', 'soic']).toContain(dna1.circuit.chipPackage);
      expect(['green', 'black', 'blue', 'purple']).toContain(dna1.circuit.solderMaskColor);
      expect(dna1.circuit.componentDensity).toBeGreaterThan(0);
    });
  });

  describe('Multi-Mode Encoding & Optimization', () => {
    it('accurately auto-detects QR encoding modes', () => {
      expect(detectQRMode('081234567890')).toBe('numeric');
      expect(detectQRMode('HELLO WORLD 123 $%*+-.//:')).toBe('alphanumeric');
      expect(detectQRMode('https://jiwoqr.dev/cyber-city')).toBe('byte'); // contains lowercase
    });

    it('encodes pure numeric strings with higher packing efficiency', () => {
      // 25 digits
      const digits = '1234567890123456789012345';
      const matrixNumeric = encodeQR(digits, { ecc: 'M', mode: 'numeric' });
      // In numeric mode: 4 + 10 + 8*10 + 4 = 98 bits = 13 bytes => Version 1-M (capacity 16) fits!
      expect(matrixNumeric.version).toBe(1);

      // In byte mode: 4 + 8 + 25*8 = 212 bits = 27 bytes => Version 2-M (capacity 28)
      const matrixByte = encodeQR(digits, { ecc: 'M', mode: 'byte' });
      expect(matrixByte.version).toBe(2);
    });

    it('encodes uppercase alphanumeric strings efficiently', () => {
      const text = 'HELLO WORLD 2026';
      const matrix = encodeQR(text, { ecc: 'Q' });
      expect(matrix.version).toBe(1);
      expect(matrix.size).toBe(21);
    });
  });

  describe('Reed-Solomon & QR Matrix Encoder', () => {
    it('calculates Reed-Solomon ECC codewords correctly', () => {
      // Test message block
      const data = new Uint8Array([0x10, 0x20, 0x0c, 0x56, 0x61]);
      const ecc = calculateECC(data, 5);
      expect(ecc.length).toBe(5);
      // Deterministic check
      const eccAgain = calculateECC(data, 5);
      expect(Array.from(ecc)).toEqual(Array.from(eccAgain));
    });

    it('encodes a QR matrix with standard dimensions and minimum 4 Quiet Zone modules', () => {
      const text = 'HELLO JIWO';
      const matrix = encodeQR(text, { ecc: 'M', quietZone: 4 });

      // Version 1 QR code is 21x21 modules
      expect(matrix.size).toBe(21);
      expect(matrix.quietZone).toBe(4);
      // Total size = 21 + 2*4 = 29
      expect(matrix.totalSize).toBe(29);
      expect(matrix.grid.length).toBe(29);
      expect(matrix.grid[0].length).toBe(29);

      // Check quiet zone borders
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 29; x++) {
          const mod = matrix.get(x, y)!;
          expect(mod.type).toBe('QUIET');
          expect(mod.isDark).toBe(false);
        }
      }

      // Check Finder patterns at (4, 4) in total grid (which is (0,0) in QR matrix)
      // Top-left finder center (3, 3) relative to QR -> (7, 7) in total grid
      const finderCenter = matrix.get(7, 7)!;
      expect(finderCenter.type).toBe('FINDER');
      expect(finderCenter.isDark).toBe(true);

      // Separator module adjacent to finder
      const sepModule = matrix.get(11, 4)!;
      expect(sepModule.type).toBe('FINDER_SEPARATOR');
      expect(sepModule.isDark).toBe(false);
    });

    it('creates complete JiwoQREntity via createJiwoQR', () => {
      const entity = createJiwoQR('https://jiwoqr.dev');
      expect(entity.matrix).toBeDefined();
      expect(entity.dna).toBeDefined();
      expect(entity.dna.circuit).toBeDefined();
      expect(entity.matrix.version).toBeGreaterThanOrEqual(1);
      expect(entity.matrix.ecc).toBe('Q'); // Default adaptive ECC Q
    });
  });
});

