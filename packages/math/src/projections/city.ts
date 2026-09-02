import { CityModuleTransform, CityBuildingTier, Vec3 } from '../types.js';
import { lerp, lerpVec3, easeInOutCubic } from '../easing.js';

export interface CityOptions {
  moduleSize?: number;
  gap?: number;
  baseHeight?: number;
  maxHeight?: number;
  skylineDensity?: number;
  landmarkMultiplier?: number;
  buildingScale?: number;
}

export type GridDarkSampler = (x: number, y: number) => boolean;

/**
 * Computes deterministic street-facing rotation around Z-axis (yaw) based on neighboring cells.
 * Returns angle in radians: 0 (East), PI/2 (North), PI (West), 3PI/2 (South).
 */
export function computeStreetFacingAngle(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDarkSampler?: GridDarkSampler,
  seed32: number = 0
): number {
  if (!isDarkSampler) {
    const rotStep = Math.abs((seed32 ^ (gridX * 13) ^ (gridY * 37)) % 4);
    return rotStep * (Math.PI / 2);
  }

  // Orthogonal neighbors: true if light (open street/plaza), false if dark (solid building)
  const isEastStreet = gridX + 1 >= totalGridSize || !isDarkSampler(gridX + 1, gridY);
  const isWestStreet = gridX - 1 < 0 || !isDarkSampler(gridX - 1, gridY);
  const isNorthStreet = gridY - 1 < 0 || !isDarkSampler(gridX, gridY - 1);
  const isSouthStreet = gridY + 1 >= totalGridSize || !isDarkSampler(gridX, gridY + 1);

  const openCount = (isEastStreet ? 1 : 0) + (isWestStreet ? 1 : 0) + (isNorthStreet ? 1 : 0) + (isSouthStreet ? 1 : 0);

  if (openCount === 1) {
    // Face the single open street
    if (isNorthStreet) return Math.PI / 2; // +Y
    if (isSouthStreet) return -Math.PI / 2; // -Y
    if (isEastStreet) return 0; // +X
    if (isWestStreet) return Math.PI; // -X
  } else if (openCount === 2) {
    // Corner lot or avenue corridor
    if (isNorthStreet && isEastStreet) return Math.PI / 4;
    if (isNorthStreet && isWestStreet) return (3 * Math.PI) / 4;
    if (isSouthStreet && isEastStreet) return -Math.PI / 4;
    if (isSouthStreet && isWestStreet) return (-3 * Math.PI) / 4;
    if (isNorthStreet || isSouthStreet) return Math.PI / 2;
    return 0;
  }

  // Multi-street or interior lot: deterministic grid-aligned yaw (0, 90, 180, 270 deg)
  const rotStep = Math.abs((seed32 ^ (gridX * 17) ^ (gridY * 43)) % 4);
  return rotStep * (Math.PI / 2);
}

/**
 * Computes deterministic 3D and 2D transforms for a module in the City Metropolis archetype.
 */
export function computeCityModuleTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  modelCount: number = 1,
  isDarkSampler?: GridDarkSampler,
  options: CityOptions = {}
): CityModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.05;
  const unit = moduleSize + gap;
  const baseHeight = options.baseHeight ?? 0.8;
  const maxHeight = options.maxHeight ?? 4.0;
  const landmarkMultiplier = options.landmarkMultiplier ?? 2.2;
  const buildingScale = options.buildingScale ?? 1.0;

  // Center coordinate around (0, 0)
  const offset = ((totalGridSize - 1) * unit) / 2;
  const worldX = gridX * unit - offset;
  const worldY = -(gridY * unit - offset); // Invert Y so (0,0) is top-left in 2D view

  // Cellular block zoning (group 3x3 or 4x4 clusters into coherent districts)
  const blockSize = 3;
  const blockX = Math.floor(gridX / blockSize);
  const blockY = Math.floor(gridY / blockSize);
  const zoneId = Math.abs((seed32 ^ (blockX * 73856093) ^ (blockY * 19349663)) % 100);

  // Proximity to center of QR matrix
  const centerX = (totalGridSize - 1) / 2;
  const centerY = (totalGridSize - 1) / 2;
  const distFromCenter = Math.hypot(gridX - centerX, gridY - centerY) / (centerX * Math.SQRT2);
  const centerWeight = Math.max(0, 1.0 - distFromCenter);

  let tier: CityBuildingTier = 'URBAN_BLOCK';
  let height3D = 0.02;

  if (isDark) {
    if (isFinder) {
      tier = 'LANDMARK_TOWER';
      height3D = maxHeight * landmarkMultiplier;
    } else if (centerWeight > 0.65) {
      tier = 'HIGH_RISE';
      height3D = baseHeight + (maxHeight - baseHeight) * (0.6 + 0.4 * centerWeight);
    } else if (centerWeight > 0.35) {
      tier = 'MID_RISE';
      height3D = baseHeight + (maxHeight - baseHeight) * (0.35 + 0.3 * centerWeight);
    } else {
      tier = 'URBAN_BLOCK';
      height3D = baseHeight + (maxHeight - baseHeight) * 0.25;
    }

    // Deterministic subtle height variance
    const varianceHash = Math.abs((seed32 ^ (gridX * 1274126177) ^ (gridY * 668265263)) % 1000) / 1000;
    height3D *= 0.85 + 0.3 * varianceHash;
  }

  // Model selection: assign model index deterministically based on tier, zone, and coords
  const safeModelCount = Math.max(1, modelCount);
  let modelIndex = 0;
  if (modelCount > 1) {
    if (isFinder) {
      // Finder corners get the most iconic / tallest model index (or model 0)
      modelIndex = Math.abs(seed32 % safeModelCount);
    } else {
      // Cohesive zoning selection with slight coordinate variation
      modelIndex = Math.abs((zoneId + (gridX % 2) + (gridY % 2)) % safeModelCount);
    }
  }

  const rotationZ = computeStreetFacingAngle(gridX, gridY, totalGridSize, isDarkSampler, seed32);

  const position3D: Vec3 = {
    x: worldX,
    y: worldY,
    z: 0.0, // Base resting directly on Z = 0 substrate
  };

  const scale3D: Vec3 = {
    x: moduleSize * buildingScale,
    y: moduleSize * buildingScale,
    z: height3D,
  };

  const position2D: Vec3 = {
    x: worldX,
    y: worldY,
    z: 0.01,
  };

  const scale2D: Vec3 = {
    x: moduleSize,
    y: moduleSize,
    z: 0.02,
  };

  return {
    gridX,
    gridY,
    isDark,
    isFinder,
    tier,
    modelIndex,
    position3D,
    position2D,
    scale3D,
    scale2D,
    rotationZ,
    zoneId,
  };
}

/**
 * Smoothly interpolates city building transform from 3D metropolis (t = 0) to canonical 2D scan (t = 1).
 */
export function interpolateCityTransform(
  transform: CityModuleTransform,
  t: number
): { position: Vec3; scale: Vec3; rotationZ: number } {
  const easedT = easeInOutCubic(t);
  return {
    position: lerpVec3(transform.position3D, transform.position2D, easedT),
    scale: lerpVec3(transform.scale3D, transform.scale2D, easedT),
    rotationZ: lerp(transform.rotationZ, 0, easedT),
  };
}
