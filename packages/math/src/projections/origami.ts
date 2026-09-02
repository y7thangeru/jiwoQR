import { OrigamiModuleTransform, OrigamiFoldStyle, Vec3 } from '../types.js';
import { lerp, lerpVec3, easeInOutCubic } from '../easing.js';

export interface OrigamiOptions {
  moduleSize?: number;
  gap?: number;
  baseHeight?: number;
  maxHeight?: number;
  variance?: number;
  finderMultiplier?: number;
}

/**
 * Computes deterministic pseudo-random hash for origami paper folds.
 */
function hashCoord(x: number, y: number, seed32: number, prime: number): number {
  let h = (seed32 ^ (x * 374761393) ^ (y * 668265263) ^ prime) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Computes 3D origami paper fold transform and 2D canonical flat target for a QR module.
 */
export function computeOrigamiModuleTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  options: OrigamiOptions = {}
): OrigamiModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const baseHeight = options.baseHeight ?? 0.6;
  const maxHeight = options.maxHeight ?? 3.2;
  const variance = options.variance ?? 0.65;
  const finderMultiplier = options.finderMultiplier ?? 2.0;

  const offset = ((totalGridSize - 1) * unit) / 2;
  const worldX = gridX * unit - offset;
  const worldY = -(gridY * unit - offset);

  const foldStyles: OrigamiFoldStyle[] = [
    'mountain',
    'diagonal_pyramid',
    'valley',
    'crane_wing',
  ];

  const styleIdx = Math.floor(hashCoord(gridX, gridY, seed32, 17) * 3); // mountain, diagonal_pyramid, valley for standard modules
  const foldStyle: OrigamiFoldStyle = isFinder ? 'crane_wing' : foldStyles[styleIdx];

  let height3D = 0.01;
  let rotationZ = 0;
  let foldAngle = 0;
  let creaseSharpness = 0.8;

  if (isDark) {
    if (isFinder) {
      // Elevated Origami Crane Crown monument
      height3D = maxHeight * finderMultiplier;
      rotationZ = ((gridX + gridY) % 4) * (Math.PI / 4);
      foldAngle = (48 * Math.PI) / 180;
      creaseSharpness = 0.95;
    } else {
      const hFactor = hashCoord(gridX, gridY, seed32, 29);
      const dynamicRange = maxHeight - baseHeight;
      height3D = baseHeight + dynamicRange * hFactor * variance;

      // Origami crease orientations: orthogonal (0, 90 deg) or diagonal folds (45, 135 deg)
      const rFactors = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
      const rIdx = Math.floor(hashCoord(gridX, gridY, seed32, 53) * rFactors.length);
      rotationZ = rFactors[rIdx];

      const aFactor = hashCoord(gridX, gridY, seed32, 79);
      foldAngle = ((28 + aFactor * 24) * Math.PI) / 180; // 28 - 52 degrees fold

      const sFactor = hashCoord(gridX, gridY, seed32, 113);
      creaseSharpness = 0.65 + sFactor * 0.3;
    }
  }

  const position3D: Vec3 = {
    x: worldX,
    y: worldY,
    z: height3D * 0.5,
  };

  const scale3D: Vec3 = isDark
    ? {
        x: moduleSize * 0.96,
        y: moduleSize * 0.96,
        z: height3D,
      }
    : { x: 0, y: 0, z: 0 };

  const position2D: Vec3 = {
    x: worldX,
    y: worldY,
    z: 0.005,
  };

  const scale2D: Vec3 = isDark
    ? {
        x: moduleSize,
        y: moduleSize,
        z: 0.01,
      }
    : { x: 0, y: 0, z: 0 };

  return {
    gridX,
    gridY,
    isDark,
    isFinder,
    foldStyle,
    position3D,
    position2D,
    scale3D,
    scale2D,
    rotationZ,
    foldAngle,
    creaseSharpness,
  };
}

/**
 * Evaluates the mechanical paper unfolding state for a given morph progress t in [0.0, 1.0].
 * At t = 0.0: Fully folded 3D paper polyhedron with sharp mountain/valley creases and elevated crane crowns.
 * At t = 1.0: Mechanically unfolded and flattened flush into a canonical solid 2D square module.
 */
export function calculateOrigamiUnfold(
  transform: OrigamiModuleTransform,
  t: number
): {
  position: Vec3;
  scale: Vec3;
  foldAngle: number;
  rotationZ: number;
} {
  const eased = easeInOutCubic(Math.max(0, Math.min(1, t)));

  const position = lerpVec3(transform.position3D, transform.position2D, eased);
  const scale = lerpVec3(transform.scale3D, transform.scale2D, eased);
  const foldAngle = lerp(transform.foldAngle, 0, eased);
  const rotationZ = lerp(transform.rotationZ, 0, eased);

  return {
    position,
    scale,
    foldAngle,
    rotationZ,
  };
}
