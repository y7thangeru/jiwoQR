import { ECCLevel } from '../types.js';

export interface ECCBlockInfo {
  totalECC: number;
  group1Blocks: number;
  group1DataPerBlock: number;
  group2Blocks: number;
  group2DataPerBlock: number;
}

/**
 * ECC indicators according to QR spec:
 * L = 01 (1)
 * M = 00 (0)
 * Q = 11 (3)
 * H = 10 (2)
 */
export const ECC_FORMAT_BITS: Record<ECCLevel, number> = {
  M: 0,
  L: 1,
  H: 2,
  Q: 3,
};

/**
 * Alignment pattern center coordinates for QR versions 1 through 40.
 */
export const ALIGNMENT_PATTERN_COORDINATES: number[][] = [
  [], // Version 0 (unused)
  [], // Version 1 (no alignment)
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

/**
 * Total raw data capacity (in codewords = bytes) for each version and ECC level.
 * [version][ecc]: [totalECCPerBlock, g1Blocks, g1Data, g2Blocks, g2Data]
 */
export const ECC_TABLE: Record<number, Record<ECCLevel, ECCBlockInfo>> = {
  1: {
    L: { totalECC: 7, group1Blocks: 1, group1DataPerBlock: 19, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 10, group1Blocks: 1, group1DataPerBlock: 16, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 13, group1Blocks: 1, group1DataPerBlock: 13, group2Blocks: 0, group2DataPerBlock: 0 },
    H: { totalECC: 17, group1Blocks: 1, group1DataPerBlock: 9, group2Blocks: 0, group2DataPerBlock: 0 },
  },
  2: {
    L: { totalECC: 10, group1Blocks: 1, group1DataPerBlock: 34, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 16, group1Blocks: 1, group1DataPerBlock: 28, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 22, group1Blocks: 1, group1DataPerBlock: 22, group2Blocks: 0, group2DataPerBlock: 0 },
    H: { totalECC: 28, group1Blocks: 1, group1DataPerBlock: 16, group2Blocks: 0, group2DataPerBlock: 0 },
  },
  3: {
    L: { totalECC: 15, group1Blocks: 1, group1DataPerBlock: 55, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 26, group1Blocks: 1, group1DataPerBlock: 44, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 17, group2Blocks: 0, group2DataPerBlock: 0 },
    H: { totalECC: 22, group1Blocks: 2, group1DataPerBlock: 13, group2Blocks: 0, group2DataPerBlock: 0 },
  },
  4: {
    L: { totalECC: 20, group1Blocks: 1, group1DataPerBlock: 80, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 32, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 26, group1Blocks: 2, group1DataPerBlock: 24, group2Blocks: 0, group2DataPerBlock: 0 },
    H: { totalECC: 16, group1Blocks: 4, group1DataPerBlock: 9, group2Blocks: 0, group2DataPerBlock: 0 },
  },
  5: {
    L: { totalECC: 26, group1Blocks: 1, group1DataPerBlock: 108, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 24, group1Blocks: 2, group1DataPerBlock: 43, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 15, group2Blocks: 2, group2DataPerBlock: 16 },
    H: { totalECC: 22, group1Blocks: 2, group1DataPerBlock: 11, group2Blocks: 2, group2DataPerBlock: 12 },
  },
  6: {
    L: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 68, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 16, group1Blocks: 4, group1DataPerBlock: 27, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 24, group1Blocks: 4, group1DataPerBlock: 19, group2Blocks: 0, group2DataPerBlock: 0 },
    H: { totalECC: 28, group1Blocks: 4, group1DataPerBlock: 15, group2Blocks: 0, group2DataPerBlock: 0 },
  },
  7: {
    L: { totalECC: 20, group1Blocks: 2, group1DataPerBlock: 78, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 18, group1Blocks: 4, group1DataPerBlock: 31, group2Blocks: 0, group2DataPerBlock: 0 },
    Q: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 14, group2Blocks: 4, group2DataPerBlock: 15 },
    H: { totalECC: 26, group1Blocks: 4, group1DataPerBlock: 13, group2Blocks: 1, group2DataPerBlock: 14 },
  },
  8: {
    L: { totalECC: 24, group1Blocks: 2, group1DataPerBlock: 97, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 22, group1Blocks: 2, group1DataPerBlock: 38, group2Blocks: 2, group2DataPerBlock: 39 },
    Q: { totalECC: 22, group1Blocks: 4, group1DataPerBlock: 18, group2Blocks: 2, group2DataPerBlock: 19 },
    H: { totalECC: 26, group1Blocks: 4, group1DataPerBlock: 14, group2Blocks: 2, group2DataPerBlock: 15 },
  },
  9: {
    L: { totalECC: 30, group1Blocks: 2, group1DataPerBlock: 116, group2Blocks: 0, group2DataPerBlock: 0 },
    M: { totalECC: 22, group1Blocks: 3, group1DataPerBlock: 36, group2Blocks: 2, group2DataPerBlock: 37 },
    Q: { totalECC: 20, group1Blocks: 4, group1DataPerBlock: 16, group2Blocks: 4, group2DataPerBlock: 17 },
    H: { totalECC: 24, group1Blocks: 4, group1DataPerBlock: 12, group2Blocks: 4, group2DataPerBlock: 13 },
  },
  10: {
    L: { totalECC: 18, group1Blocks: 2, group1DataPerBlock: 68, group2Blocks: 2, group2DataPerBlock: 69 },
    M: { totalECC: 26, group1Blocks: 4, group1DataPerBlock: 43, group2Blocks: 1, group2DataPerBlock: 44 },
    Q: { totalECC: 24, group1Blocks: 6, group1DataPerBlock: 19, group2Blocks: 2, group2DataPerBlock: 20 },
    H: { totalECC: 28, group1Blocks: 6, group1DataPerBlock: 15, group2Blocks: 2, group2DataPerBlock: 16 },
  },
};

/**
 * Returns total data capacity in bytes for a given version and ECC level.
 */
export function getDataCapacity(version: number, ecc: ECCLevel): number {
  const info = ECC_TABLE[version]?.[ecc];
  if (!info) throw new Error(`Version ${version} with ECC ${ecc} not supported in capacity table`);
  return (
    info.group1Blocks * info.group1DataPerBlock +
    info.group2Blocks * info.group2DataPerBlock
  );
}

/**
 * Precomputed 15-bit format info values for each (ECC, mask) combination.
 * Encoded with BCH(15, 5) and XORed with 0x5412.
 */
const FORMAT_INFO_MASK = 0x5412;
const FORMAT_INFO_POLY = 0x537;

export function getFormatInfo(ecc: ECCLevel, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data << 10;
  for (let i = 4; i >= 0; i--) {
    if ((rem >> (i + 10)) & 1) {
      rem ^= FORMAT_INFO_POLY << i;
    }
  }
  return ((data << 10) | rem) ^ FORMAT_INFO_MASK;
}
