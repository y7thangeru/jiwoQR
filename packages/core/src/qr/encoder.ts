import {
  ECCLevel,
  ModuleType,
  QRMatrix,
  QRModule,
  EncodeOptions,
  QRMode,
} from '../types.js';
import {
  ALIGNMENT_PATTERN_COORDINATES,
  ECC_TABLE,
  getDataCapacity,
  getFormatInfo,
} from './tables.js';
import { calculateECC } from './reed-solomon.js';

interface RawGridModule {
  isDark: boolean;
  type: ModuleType;
  isReserved: boolean;
}

const NUMERIC_REGEX = /^[0-9]+$/;
const ALPHANUMERIC_CHARS: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
  'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27,
  'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35,
  ' ': 36, '$': 37, '%': 38, '*': 39, '+': 40, '-': 41, '.': 42, '/': 43, ':': 44,
};

/**
 * Automatically detects the most efficient standard QR encoding mode.
 */
export function detectQRMode(payload: string): QRMode {
  if (payload.length > 0 && NUMERIC_REGEX.test(payload)) {
    return 'numeric';
  }
  let isAlphanumeric = payload.length > 0;
  for (let i = 0; i < payload.length; i++) {
    if (ALPHANUMERIC_CHARS[payload[i]] === undefined) {
      isAlphanumeric = false;
      break;
    }
  }
  if (isAlphanumeric) {
    return 'alphanumeric';
  }
  return 'byte';
}

function getCharCountIndicatorBits(mode: QRMode, version: number): number {
  if (mode === 'numeric') {
    return version < 10 ? 10 : version < 27 ? 12 : 14;
  }
  if (mode === 'alphanumeric') {
    return version < 10 ? 9 : version < 27 ? 11 : 13;
  }
  // Byte mode
  return version < 10 ? 8 : 16;
}

function getModeIndicator(mode: QRMode): number {
  switch (mode) {
    case 'numeric':
      return 0b0001;
    case 'alphanumeric':
      return 0b0010;
    case 'byte':
      return 0b0100;
  }
}

function calculateTotalDataBits(
  mode: QRMode,
  payload: string,
  dataBytes: Uint8Array,
  version: number
): number {
  const headerBits = 4 + getCharCountIndicatorBits(mode, version);
  let payloadBits = 0;

  if (mode === 'numeric') {
    const fullChunks = Math.floor(payload.length / 3);
    const rem = payload.length % 3;
    payloadBits = fullChunks * 10 + (rem === 2 ? 7 : rem === 1 ? 4 : 0);
  } else if (mode === 'alphanumeric') {
    const fullChunks = Math.floor(payload.length / 2);
    const rem = payload.length % 2;
    payloadBits = fullChunks * 11 + (rem === 1 ? 6 : 0);
  } else {
    payloadBits = dataBytes.length * 8;
  }

  return headerBits + payloadBits;
}

/**
 * Encodes a string payload into a semantic QRMatrix conforming to ISO/IEC 18004.
 */
export function encodeQR(payload: string, options: EncodeOptions = {}): QRMatrix {
  const ecc: ECCLevel = options.ecc ?? 'Q'; // Adaptive default 'Q' (25% recovery for 3D procedural rendering)
  const quietZone = options.quietZone ?? 4; // Minimum 4 modules Quiet Zone as per ISO/IEC 18004

  // Determine encoding mode
  let mode: QRMode;
  if (!options.mode || options.mode === 'auto') {
    mode = detectQRMode(payload);
  } else {
    mode = options.mode;
    if (mode === 'numeric' && !NUMERIC_REGEX.test(payload)) {
      throw new Error(`Payload "${payload}" contains non-numeric characters for numeric mode`);
    }
    if (mode === 'alphanumeric') {
      for (const char of payload) {
        if (ALPHANUMERIC_CHARS[char] === undefined) {
          throw new Error(`Character "${char}" is not valid in QR alphanumeric mode`);
        }
      }
    }
  }

  const textEncoder = new TextEncoder();
  const dataBytes = mode === 'byte' ? textEncoder.encode(payload) : new Uint8Array(0);

  // 1. Select minimum version that fits data with optimal packing
  let version = options.minVersion ?? 1;
  const maxVersion = options.maxVersion ?? 10;
  let capacity = 0;

  while (version <= maxVersion) {
    capacity = getDataCapacity(version, ecc);
    const totalBits = calculateTotalDataBits(mode, payload, dataBytes, version);
    const requiredBytes = Math.ceil(totalBits / 8);
    if (requiredBytes <= capacity) {
      break;
    }
    version++;
  }

  if (version > maxVersion) {
    throw new Error(
      `Payload too large for versions up to ${maxVersion} with ECC ${ecc} in ${mode} mode. Payload length: ${payload.length}`
    );
  }

  // 2. Build data bitstream
  const bitstream: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  // 2a. Mode indicator
  pushBits(getModeIndicator(mode), 4);

  // 2b. Character count indicator
  const charCountBits = getCharCountIndicatorBits(mode, version);
  const charCount = mode === 'byte' ? dataBytes.length : payload.length;
  pushBits(charCount, charCountBits);

  // 2c. Encode payload data according to mode
  if (mode === 'numeric') {
    let i = 0;
    while (i < payload.length) {
      if (i + 3 <= payload.length) {
        const val = parseInt(payload.substring(i, i + 3), 10);
        pushBits(val, 10);
        i += 3;
      } else if (i + 2 <= payload.length) {
        const val = parseInt(payload.substring(i, i + 2), 10);
        pushBits(val, 7);
        i += 2;
      } else {
        const val = parseInt(payload.substring(i, i + 1), 10);
        pushBits(val, 4);
        i += 1;
      }
    }
  } else if (mode === 'alphanumeric') {
    let i = 0;
    while (i < payload.length) {
      if (i + 2 <= payload.length) {
        const c1 = ALPHANUMERIC_CHARS[payload[i]];
        const c2 = ALPHANUMERIC_CHARS[payload[i + 1]];
        const val = c1 * 45 + c2;
        pushBits(val, 11);
        i += 2;
      } else {
        const c1 = ALPHANUMERIC_CHARS[payload[i]];
        pushBits(c1, 6);
        i += 1;
      }
    }
  } else {
    // Byte mode
    for (const byte of dataBytes) {
      pushBits(byte, 8);
    }
  }

  // 2d. Terminator: up to 4 zeroes
  const remainingBitsForCodewords = capacity * 8 - bitstream.length;
  const terminatorCount = Math.min(4, Math.max(0, remainingBitsForCodewords));
  pushBits(0, terminatorCount);

  // 2e. Pad to byte boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // 2f. Pad bytes: alternating 0xEC (11101100) and 0x11 (00010001)
  const padBytes = [0b11101100, 0b00010001];
  let padIdx = 0;
  while (bitstream.length < capacity * 8) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bitstream to data codewords
  const dataCodewords = new Uint8Array(capacity);
  for (let i = 0; i < capacity; i++) {
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      byteVal = (byteVal << 1) | bitstream[i * 8 + bit];
    }
    dataCodewords[i] = byteVal;
  }


  // 3. Error Correction Coding and Interleaving
  const eccInfo = ECC_TABLE[version][ecc];
  const { totalECC, group1Blocks, group1DataPerBlock, group2Blocks, group2DataPerBlock } = eccInfo;
  const totalBlocks = group1Blocks + group2Blocks;

  const blockData: Uint8Array[] = [];
  const blockECC: Uint8Array[] = [];

  let dataOffset = 0;
  for (let b = 0; b < group1Blocks; b++) {
    const block = dataCodewords.subarray(dataOffset, dataOffset + group1DataPerBlock);
    blockData.push(block);
    blockECC.push(calculateECC(block, totalECC));
    dataOffset += group1DataPerBlock;
  }
  for (let b = 0; b < group2Blocks; b++) {
    const block = dataCodewords.subarray(dataOffset, dataOffset + group2DataPerBlock);
    blockData.push(block);
    blockECC.push(calculateECC(block, totalECC));
    dataOffset += group2DataPerBlock;
  }

  // Interleave data codewords
  const interleavedBits: number[] = [];
  const maxDataLength = Math.max(group1DataPerBlock, group2DataPerBlock);
  for (let i = 0; i < maxDataLength; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < blockData[b].length) {
        pushByteToBits(interleavedBits, blockData[b][i]);
      }
    }
  }

  // Interleave ECC codewords
  for (let i = 0; i < totalECC; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      pushByteToBits(interleavedBits, blockECC[b][i]);
    }
  }

  // 4. Construct QR Grid
  const qrSize = 4 * version + 17;
  const grid: RawGridModule[][] = Array.from({ length: qrSize }, () =>
    Array.from({ length: qrSize }, () => ({
      isDark: false,
      type: 'DATA',
      isReserved: false,
    }))
  );

  // 4a. Place Finder Patterns & Separators
  function placeFinder(top: number, left: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const y = top + r;
        const x = left + c;
        if (x < 0 || x >= qrSize || y < 0 || y >= qrSize) continue;

        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[y][x] = {
            isDark: isBorder || isCenter,
            type: 'FINDER',
            isReserved: true,
          };
        } else {
          // Separator
          grid[y][x] = {
            isDark: false,
            type: 'FINDER_SEPARATOR',
            isReserved: true,
          };
        }
      }
    }
  }

  placeFinder(0, 0); // Top-left
  placeFinder(0, qrSize - 7); // Top-right
  placeFinder(qrSize - 7, 0); // Bottom-left

  // 4b. Place Alignment Patterns
  const alignCoords = ALIGNMENT_PATTERN_COORDINATES[version];
  for (const cy of alignCoords) {
    for (const cx of alignCoords) {
      // Don't place alignment patterns over finder patterns
      const nearFinder =
        (cy <= 8 && cx <= 8) ||
        (cy <= 8 && cx >= qrSize - 9) ||
        (cy >= qrSize - 9 && cx <= 8);
      if (nearFinder) continue;

      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const y = cy + r;
          const x = cx + c;
          const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
          const isCenter = r === 0 && c === 0;
          grid[y][x] = {
            isDark: isBorder || isCenter,
            type: 'ALIGNMENT',
            isReserved: true,
          };
        }
      }
    }
  }

  // 4c. Place Timing Patterns
  for (let i = 8; i < qrSize - 8; i++) {
    if (!grid[6][i].isReserved) {
      grid[6][i] = { isDark: i % 2 === 0, type: 'TIMING', isReserved: true };
    }
    if (!grid[i][6].isReserved) {
      grid[i][6] = { isDark: i % 2 === 0, type: 'TIMING', isReserved: true };
    }
  }

  // 4d. Dark Module
  grid[4 * version + 9][8] = { isDark: true, type: 'DARK', isReserved: true };

  // 4e. Reserve Format Information Areas
  for (let i = 0; i < 9; i++) {
    if (!grid[8][i].isReserved) grid[8][i] = { isDark: false, type: 'FORMAT', isReserved: true };
    if (!grid[i][8].isReserved) grid[i][8] = { isDark: false, type: 'FORMAT', isReserved: true };
  }
  for (let i = qrSize - 8; i < qrSize; i++) {
    if (!grid[8][i].isReserved) grid[8][i] = { isDark: false, type: 'FORMAT', isReserved: true };
    if (!grid[i][8].isReserved) grid[i][8] = { isDark: false, type: 'FORMAT', isReserved: true };
  }

  // 4f. Place Interleaved Data Bits (Zig-zag upward and downward)
  let bitIndex = 0;
  let dir = -1; // -1: upward, +1: downward
  let col = qrSize - 1;

  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing pattern column

    const rowStart = dir === -1 ? qrSize - 1 : 0;
    const rowEnd = dir === -1 ? -1 : qrSize;

    for (let row = rowStart; row !== rowEnd; row += dir) {
      for (const c of [col, col - 1]) {
        if (!grid[row][c].isReserved) {
          const bit = bitIndex < interleavedBits.length ? interleavedBits[bitIndex] : 0;
          grid[row][c] = {
            isDark: bit === 1,
            type: 'DATA',
            isReserved: false, // will be masked
          };
          bitIndex++;
        }
      }
    }
    col -= 2;
    dir = -dir;
  }

  // 5. Mask Evaluation (Find lowest penalty mask 0..7)
  const maskFunctions: ((x: number, y: number) => boolean)[] = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x, _y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) === 0,
    (x, y) => ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0,
    (x, y) => ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0,
  ];

  let bestMask = 0;
  let minPenalty = Infinity;

  for (let m = 0; m < 8; m++) {
    const penalty = calculatePenalty(grid, qrSize, maskFunctions[m]);
    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestMask = m;
    }
  }

  // Apply best mask to data modules
  const bestMaskFn = maskFunctions[bestMask];
  for (let r = 0; r < qrSize; r++) {
    for (let c = 0; c < qrSize; c++) {
      if (!grid[r][c].isReserved && grid[r][c].type === 'DATA') {
        if (bestMaskFn(c, r)) {
          grid[r][c].isDark = !grid[r][c].isDark;
        }
      }
    }
  }

  // 6. Write Format Info (15 bits)
  const formatInfo = getFormatInfo(ecc, bestMask);
  writeFormatInfo(grid, qrSize, formatInfo);

  // 7. Embed into final matrix with Quiet Zone
  const totalSize = qrSize + 2 * quietZone;
  const finalGrid: QRModule[][] = [];

  for (let y = 0; y < totalSize; y++) {
    const row: QRModule[] = [];
    for (let x = 0; x < totalSize; x++) {
      const qrX = x - quietZone;
      const qrY = y - quietZone;

      if (qrX >= 0 && qrX < qrSize && qrY >= 0 && qrY < qrSize) {
        const raw = grid[qrY][qrX];
        row.push({
          x,
          y,
          isDark: raw.isDark,
          type: raw.type,
        });
      } else {
        // Quiet Zone margin
        row.push({
          x,
          y,
          isDark: false,
          type: 'QUIET',
        });
      }
    }
    finalGrid.push(row);
  }

  return {
    size: qrSize,
    version,
    ecc,
    quietZone,
    totalSize,
    grid: finalGrid,
    get(x: number, y: number) {
      if (y < 0 || y >= totalSize || x < 0 || x >= totalSize) return undefined;
      return finalGrid[y][x];
    },
  };
}

function pushByteToBits(target: number[], byte: number) {
  for (let i = 7; i >= 0; i--) {
    target.push((byte >> i) & 1);
  }
}

function writeFormatInfo(grid: RawGridModule[][], size: number, formatInfo: number) {
  // Top-left finder format placement
  // Format bit 0..5 -> (8, 0)..(8, 5)
  for (let i = 0; i <= 5; i++) {
    grid[8][i].isDark = ((formatInfo >> i) & 1) === 1;
  }
  grid[8][7].isDark = ((formatInfo >> 6) & 1) === 1;
  grid[8][8].isDark = ((formatInfo >> 7) & 1) === 1;
  grid[7][8].isDark = ((formatInfo >> 8) & 1) === 1;

  for (let i = 9; i <= 14; i++) {
    grid[14 - i][8].isDark = ((formatInfo >> i) & 1) === 1;
  }

  // Second copy around other finders
  // (size - 1 down to size - 7, 8)
  for (let i = 0; i < 7; i++) {
    grid[size - 1 - i][8].isDark = ((formatInfo >> i) & 1) === 1;
  }
  // (8, size - 8 up to size - 1)
  for (let i = 7; i < 15; i++) {
    grid[8][size - 15 + i].isDark = ((formatInfo >> i) & 1) === 1;
  }
}

function calculatePenalty(
  grid: RawGridModule[][],
  size: number,
  maskFn: (x: number, y: number) => boolean
): number {
  let penalty = 0;

  // Helper to read module color taking current mask into account
  function getIsDark(r: number, c: number): boolean {
    const mod = grid[r][c];
    if (mod.isReserved || mod.type !== 'DATA') return mod.isDark;
    return maskFn(c, r) ? !mod.isDark : mod.isDark;
  }

  let darkCount = 0;

  // Condition 1: 5 or more same color consecutive in row & col
  for (let r = 0; r < size; r++) {
    let rowConsecutive = 1;
    let colConsecutive = 1;

    for (let c = 1; c < size; c++) {
      // Row
      if (getIsDark(r, c) === getIsDark(r, c - 1)) {
        rowConsecutive++;
      } else {
        if (rowConsecutive >= 5) penalty += 3 + (rowConsecutive - 5);
        rowConsecutive = 1;
      }
      // Col
      if (getIsDark(c, r) === getIsDark(c - 1, r)) {
        colConsecutive++;
      } else {
        if (colConsecutive >= 5) penalty += 3 + (colConsecutive - 5);
        colConsecutive = 1;
      }
    }
    if (rowConsecutive >= 5) penalty += 3 + (rowConsecutive - 5);
    if (colConsecutive >= 5) penalty += 3 + (colConsecutive - 5);
  }

  // Condition 2: 2x2 same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const color = getIsDark(r, c);
      if (
        color === getIsDark(r, c + 1) &&
        color === getIsDark(r + 1, c) &&
        color === getIsDark(r + 1, c + 1)
      ) {
        penalty += 3;
      }
      if (color) darkCount++;
    }
  }

  // Condition 4: Proportion of dark modules
  const totalModules = size * size;
  const darkRatioPercent = Math.floor((darkCount / totalModules) * 100);
  const diffFrom50 = Math.abs(darkRatioPercent - 50);
  penalty += Math.floor(diffFrom50 / 5) * 10;

  return penalty;
}
