import { BiomorphicModuleTransform, BiomorphicCrystalStyle, Vec3 } from '../types.js';
import { lerp, lerpVec3, easeInOutCubic } from '../easing.js';

export interface BiomorphicOptions {
  moduleSize?: number;
  gap?: number;
  baseHeight?: number;
  maxHeight?: number;
  heightVariance?: number;
  finderMultiplier?: number;
  crystalGrowthStyle?: BiomorphicCrystalStyle;
}

/**
 * Computes deterministic pseudo-random hash for crystal features.
 */
function hashCoord(x: number, y: number, seed32: number, prime: number): number {
  let h = (seed32 ^ (x * 374761393) ^ (y * 668265263) ^ prime) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Computes 3D crystalline transform and 2D scan target for a module in the Biomorphic model.
 */
export function computeBiomorphicModuleTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  options: BiomorphicOptions = {}
): BiomorphicModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const baseHeight = options.baseHeight ?? 0.4;
  const maxHeight = options.maxHeight ?? 4.0;
  const variance = options.heightVariance ?? 0.75;
  const finderMultiplier = options.finderMultiplier ?? 1.85;

  const offset = ((totalGridSize - 1) * unit) / 2;
  const worldX = gridX * unit - offset;
  const worldY = -(gridY * unit - offset);

  // Deterministic crystal growth styles
  const styles: BiomorphicCrystalStyle[] = [
    'hexagonal',
    'needle_prism',
    'geode_cluster',
    'coral_branch',
  ];
  const styleIndex = Math.floor(hashCoord(gridX, gridY, seed32, 101) * styles.length);
  const crystalStyle: BiomorphicCrystalStyle =
    options.crystalGrowthStyle ?? (isFinder ? 'geode_cluster' : styles[styleIndex]);

  let height3D = 0.02;
  let rotationZ = 0;
  let tiltAngle = 0;

  if (isDark) {
    if (isFinder) {
      // Landmark monolithic geodesic crystal monument
      height3D = maxHeight * finderMultiplier;
      rotationZ = ((gridX + gridY) % 4) * (Math.PI / 2);
      tiltAngle = 0;
    } else {
      const hFactor = hashCoord(gridX, gridY, seed32, 203);
      const dynamicRange = maxHeight - baseHeight;
      height3D = baseHeight + dynamicRange * hFactor * variance;

      // Deterministic crystal facet rotation & subtle organic tilt
      const rFactor = hashCoord(gridX, gridY, seed32, 307);
      rotationZ = (rFactor * 360 * Math.PI) / 180;

      const tFactor = hashCoord(gridX, gridY, seed32, 409);
      tiltAngle = (tFactor - 0.5) * 0.25; // Subtle organic tilt in radians
    }
  }

  const effectiveModuleSize = moduleSize;

  const position3D: Vec3 = {
    x: worldX,
    y: worldY,
    z: height3D / 2,
  };

  const scale3D: Vec3 = {
    x: effectiveModuleSize,
    y: effectiveModuleSize,
    z: height3D,
  };

  const position2D: Vec3 = {
    x: worldX,
    y: worldY,
    z: 0.01,
  };

  const scale2D: Vec3 = {
    x: effectiveModuleSize,
    y: effectiveModuleSize,
    z: 0.02,
  };

  return {
    gridX,
    gridY,
    isDark,
    isFinder,
    crystalStyle,
    position3D,
    position2D,
    scale3D,
    scale2D,
    rotationZ,
    tiltAngle,
  };
}

/**
 * Interpolates biomorphic crystal transform between 3D mineral growth (t = 0)
 * and 2D canonical flat QR module (t = 1).
 */
export function interpolateBiomorphicMorph(
  transform: BiomorphicModuleTransform,
  t: number
): { position: Vec3; scale: Vec3; rotationZ: number; tiltAngle: number } {
  const easedT = easeInOutCubic(t);
  return {
    position: lerpVec3(transform.position3D, transform.position2D, easedT),
    scale: lerpVec3(transform.scale3D, transform.scale2D, easedT),
    rotationZ: lerp(transform.rotationZ, 0, easedT),
    tiltAngle: lerp(transform.tiltAngle, 0, easedT),
  };
}
