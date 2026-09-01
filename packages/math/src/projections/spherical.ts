import { SpherifiedModuleTransform, Vec3 } from '../types.js';
import { lerpVec3, easeInOutCubic } from '../easing.js';

export interface GlobeProjectionOptions {
  globeRadius?: number;
  moduleSize?: number;
  gap?: number;
  maxHeight?: number;
  finderElevationMultiplier?: number;
}

/**
 * Maps a point on a normalized cube face [-1, 1]^3 onto a unit sphere
 * using spherified cube projection (prevents equatorial / polar distortion).
 */
export function cubeToSphere(p: Vec3, radius = 1.0): { position: Vec3; normal: Vec3 } {
  const x2 = p.x * p.x;
  const y2 = p.y * p.y;
  const z2 = p.z * p.z;

  const sx = p.x * Math.sqrt(Math.max(0, 1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3));
  const sy = p.y * Math.sqrt(Math.max(0, 1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3));
  const sz = p.z * Math.sqrt(Math.max(0, 1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3));

  const len = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1.0;
  const nx = sx / len;
  const ny = sy / len;
  const nz = sz / len;

  return {
    position: {
      x: nx * radius,
      y: ny * radius,
      z: nz * radius,
    },
    normal: {
      x: nx,
      y: ny,
      z: nz,
    },
  };
}

/**
 * Maps 2D planar normalized UV [0, 1] to spherical polar coordinates.
 */
export function uvToSphere(u: number, v: number, radius = 1.0): { position: Vec3; normal: Vec3 } {
  const theta = (u - 0.5) * 2.0 * Math.PI; // Longitude
  const phi = (v - 0.5) * Math.PI; // Latitude

  const cosPhi = Math.cos(phi);
  const nx = cosPhi * Math.sin(theta);
  const ny = Math.sin(phi);
  const nz = cosPhi * Math.cos(theta);

  return {
    position: {
      x: nx * radius,
      y: ny * radius,
      z: nz * radius,
    },
    normal: {
      x: nx,
      y: ny,
      z: nz,
    },
  };
}

/**
 * Computes 3D hemisphere mound height and transforms for the Globe model.
 * In 3D mode, the modules form a dome mound extruded from the equatorial plane Z = 0.
 * Combining top mound A and bottom cloned mound B forms a complete 3D voxel globe.
 */
export function computeGlobeModuleTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  options: GlobeProjectionOptions = {}
): SpherifiedModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalWorldSize = totalGridSize * unit;
  const maxHeight = options.maxHeight ?? totalWorldSize * 0.48;
  const finderMultiplier = options.finderElevationMultiplier ?? 1.25;

  // 2D grid centered around (0, 0)
  const offset = ((totalGridSize - 1) * unit) / 2;
  const worldX = gridX * unit - offset;
  const worldY = -(gridY * unit - offset);

  // Radial distance from center to compute the dome mound curve
  const dist = Math.hypot(worldX, worldY);
  const maxRadius = (totalWorldSize / 2) * 1.08;
  const normDist = Math.min(1.0, dist / maxRadius);

  // Semicircle dome profile factor: sqrt(1 - r^2)
  const domeFactor = Math.sqrt(Math.max(0, 1.0 - normDist * normDist));

  let height3D = 0.05; // Light modules / quiet zone
  if (isDark) {
    // Base dome height
    const baseDomeHeight = Math.max(0.3, maxHeight * domeFactor);

    if (isFinder) {
      // Landmark towers form elevated plateau at peak / corners
      height3D = Math.min(maxHeight * 1.15, baseDomeHeight * finderMultiplier + 0.5);
    } else {
      // Deterministic noise modulation for organic terrain variations
      let h = (seed32 ^ (gridX * 1597334677) ^ (gridY * 3812015801)) | 0;
      h = Math.imul(h ^ (h >>> 15), 2246822519);
      const noise = ((h ^ (h >>> 13)) >>> 0) / 4294967296;
      const noiseScale = 0.85 + noise * 0.3;
      height3D = Math.max(0.2, baseDomeHeight * noiseScale);
    }
  }

  // Top hemisphere mound A: rests on Z = 0, extruded upwards to +height3D
  const position3D: Vec3 = {
    x: worldX,
    y: worldY,
    z: height3D / 2,
  };

  const normal3D: Vec3 = { x: 0, y: 0, z: 1 };

  const scale3D: Vec3 = {
    x: moduleSize,
    y: moduleSize,
    z: height3D,
  };

  // 2D Canonical flat QR grid position (Scan Mode)
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
    position3D,
    normal3D,
    scale3D,
    position2D,
    scale2D,
  };
}

/**
 * Interpolates a globe module between 3D mound dome height and 2D flat planar position.
 */
export function interpolateGlobeMorph(
  transform: SpherifiedModuleTransform,
  t: number
): { position: Vec3; normal: Vec3; scale: Vec3 } {
  const easedT = easeInOutCubic(t);

  const position = lerpVec3(transform.position3D, transform.position2D, easedT);
  const scale = lerpVec3(transform.scale3D, transform.scale2D, easedT);
  const normal: Vec3 = { x: 0, y: 0, z: 1 };

  return { position, normal, scale };
}
