/**
 * Error correction level according to ISO/IEC 18004.
 * L: ~7% recovery
 * M: ~15% recovery
 * Q: ~25% recovery (recommended for procedural 3D)
 * H: ~30% recovery (maximum recovery for heavy 3D stylization)
 */
export type ECCLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * Semantic role of each QR module.
 * Allows 3D renderers to treat functional landmarks (finders, alignments)
 * differently from payload data modules.
 */
export type ModuleType =
  | 'FINDER'
  | 'FINDER_SEPARATOR'
  | 'ALIGNMENT'
  | 'TIMING'
  | 'DARK'
  | 'FORMAT'
  | 'VERSION'
  | 'DATA'
  | 'QUIET';

export interface QRModule {
  x: number;
  y: number;
  isDark: boolean;
  type: ModuleType;
}

export interface QRMatrix {
  /** Size in modules (e.g. 21 for version 1, 25 for version 2) */
  size: number;
  /** QR Version (1 to 40) */
  version: number;
  /** Error correction level used */
  ecc: ECCLevel;
  /** Quiet zone margin in modules (default: 4 as per ISO/IEC 18004) */
  quietZone: number;
  /** Full matrix dimensions including quiet zone (size + 2 * quietZone) */
  totalSize: number;
  /** 2D array indexed as [y][x] covering totalSize x totalSize */
  grid: QRModule[][];
  /** Fast accessor for grid coordinates */
  get(x: number, y: number): QRModule | undefined;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  groundSubstrate: string;
  finderEmissive: string;
}

export interface ArchitectureDNA {
  maxHeight: number;
  heightVariance: number;
  roofStyle: 'flat' | 'stepped' | 'sloped' | 'spire';
  facadeDensity: number;
  towerArchetype: 'monolith' | 'citadel' | 'obelisk' | 'pagoda';
  bevelRadius: number;
}

export interface GlobeDNA {
  continentElevation: number;
  oceanDepth: number;
  satelliteCount: number;
  rotationSpeed: number;
}

export interface DeterministicDNA {
  rawHash: bigint;
  seed32: number;
  normalizedUrl: string;
  palette: ColorPalette;
  architecture: ArchitectureDNA;
  globe: GlobeDNA;
}

export interface EncodeOptions {
  ecc?: ECCLevel;
  minVersion?: number;
  maxVersion?: number;
  quietZone?: number;
}

export interface JiwoQREntity {
  matrix: QRMatrix;
  dna: DeterministicDNA;
}
