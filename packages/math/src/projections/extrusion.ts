import { ExtrusionModuleTransform, Vec3 } from '../types.js';
import { lerp, lerpVec3, easeInOutCubic } from '../easing.js';

export interface ExtrusionOptions {
  moduleSize?: number;
  gap?: number;
  baseHeight?: number;
  maxHeight?: number;
  heightVariance?: number;
  landmarkMultiplier?: number;
}

/**
 * Computes deterministic height for a module using coordinate hashing and seed.
 */
export function computeModuleHeight(
  x: number,
  y: number,
  seed32: number,
  baseHeight: number,
  maxHeight: number,
  variance: number
): number {
  // Integer hash combining x, y, and seed32
  let h = (seed32 ^ (x * 374761393) ^ (y * 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  const factor = ((h ^ (h >>> 16)) >>> 0) / 4294967296;

  const dynamicRange = maxHeight - baseHeight;
  return baseHeight + dynamicRange * factor * variance;
}

/**
 * Computes 3D and 2D transforms for a module in the architecture model.
 */
export function computeExtrusionTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  options: ExtrusionOptions = {}
): ExtrusionModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.05;
  const unit = moduleSize + gap;
  const baseHeight = options.baseHeight ?? 0.3;
  const maxHeight = options.maxHeight ?? 3.5;
  const variance = options.heightVariance ?? 0.7;
  const landmarkMultiplier = options.landmarkMultiplier ?? 1.6;

  // Center coordinate around (0, 0)
  const offset = ((totalGridSize - 1) * unit) / 2;
  const worldX = gridX * unit - offset;
  const worldY = -(gridY * unit - offset); // Invert Y so (0,0) is top-left in 2D view

  let height3D = 0.02; // Default for light modules
  if (isDark) {
    if (isFinder) {
      height3D = maxHeight * landmarkMultiplier;
    } else {
      height3D = computeModuleHeight(gridX, gridY, seed32, baseHeight, maxHeight, variance);
    }
  }

  const effectiveModuleSize = moduleSize;

  const position3D: Vec3 = {
    x: worldX,
    y: worldY,
    z: height3D / 2, // Centered along Z so base rests on Z = 0
  };

  const scale3D: Vec3 = {
    x: effectiveModuleSize,
    y: effectiveModuleSize,
    z: height3D,
  };

  const position2D: Vec3 = {
    x: worldX,
    y: worldY,
    z: 0.01, // Flat plane resting above ground substrate
  };

  const scale2D: Vec3 = {
    x: effectiveModuleSize,
    y: effectiveModuleSize,
    z: 0.02, // Flat thin module
  };

  return {
    gridX,
    gridY,
    isDark,
    position3D,
    position2D,
    scale3D,
    scale2D,
  };
}

/**
 * Interpolates module transform between 3D architecture mode (t = 0) and 2D scan mode (t = 1).
 */
export function interpolateExtrusion(
  transform: ExtrusionModuleTransform,
  t: number
): { position: Vec3; scale: Vec3 } {
  const easedT = easeInOutCubic(t);
  return {
    position: lerpVec3(transform.position3D, transform.position2D, easedT),
    scale: lerpVec3(transform.scale3D, transform.scale2D, easedT),
  };
}
