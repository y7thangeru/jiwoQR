import { CircuitModuleTransform, CircuitComponentType, Vec3 } from '../types.js';
import { easeInOutCubic, lerp, lerpVec3 } from '../easing.js';

export interface CircuitTransformOptions {
  moduleSize?: number;
  gap?: number;
  chipElevation?: number;
}

/**
 * Computes 3D PCB component layout transforms and 2D canonical scan coordinates.
 */
export function computeCircuitModuleTransform(
  gridX: number,
  gridY: number,
  totalGridSize: number,
  isDark: boolean,
  isFinder: boolean,
  seed32: number,
  options: CircuitTransformOptions = {}
): CircuitModuleTransform {
  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const chipElevation = options.chipElevation ?? 0.75;

  const halfSize = (totalGridSize * unit) / 2;
  const posX = gridX * unit - halfSize + unit / 2;
  const posY = -(gridY * unit - halfSize + unit / 2);

  const position2D: Vec3 = { x: posX, y: posY, z: 0.02 };
  const scale2D: Vec3 = { x: moduleSize, y: moduleSize, z: 0.02 };

  let componentType: CircuitComponentType = 'RESISTOR';
  let height3D = 0.4;
  let scaleX3D = moduleSize * 0.85;
  let scaleY3D = moduleSize * 0.55;
  let rotationZ = 0;

  if (isFinder) {
    // Microprocessor / Main QFP/BGA IC package
    componentType = 'CHIP_IC';
    height3D = chipElevation;
    scaleX3D = moduleSize * 0.96;
    scaleY3D = moduleSize * 0.96;
    rotationZ = 0;
  } else if (isDark) {
    // Deterministic component assignment based on grid coordinates and seed
    const hash = (gridX * 73 + gridY * 37 + (seed32 & 0xffff)) % 100;
    const isRotated = (gridX * 13 + gridY * 29 + (seed32 & 0xff)) % 2 === 1;
    rotationZ = isRotated ? Math.PI / 2 : 0;

    if (hash < 32) {
      // 0805 SMD Resistor
      componentType = 'RESISTOR';
      height3D = 0.35;
      scaleX3D = moduleSize * 0.85;
      scaleY3D = moduleSize * 0.55;
    } else if (hash < 62) {
      // Ceramic SMD Capacitor
      componentType = 'CAPACITOR';
      height3D = 0.45;
      scaleX3D = moduleSize * 0.75;
      scaleY3D = moduleSize * 0.65;
    } else if (hash < 82) {
      // Gold/Copper circular VIA pad
      componentType = 'VIA_PAD';
      height3D = 0.15;
      scaleX3D = moduleSize * 0.88;
      scaleY3D = moduleSize * 0.88;
      rotationZ = 0;
    } else {
      // Conductor trace line
      componentType = isRotated ? 'TRACE_V' : 'TRACE_H';
      height3D = 0.12;
      scaleX3D = moduleSize * 0.95;
      scaleY3D = moduleSize * 0.38;
    }
  }

  const position3D: Vec3 = {
    x: posX,
    y: posY,
    z: height3D / 2,
  };

  const scale3D: Vec3 = {
    x: scaleX3D,
    y: scaleY3D,
    z: height3D,
  };

  return {
    gridX,
    gridY,
    isDark,
    isFinder,
    componentType,
    position3D,
    position2D,
    scale3D,
    scale2D,
    rotationZ,
  };
}

/**
 * Interpolates circuit module position, scale, and rotation between 3D PCB mode and canonical 2D scan mode.
 */
export function interpolateCircuitMorph(
  transform: CircuitModuleTransform,
  t: number
): { position: Vec3; scale: Vec3; rotationZ: number } {
  const easedT = easeInOutCubic(t);

  const position = lerpVec3(transform.position3D, transform.position2D, easedT);
  const scale = lerpVec3(transform.scale3D, transform.scale2D, easedT);
  const rotationZ = lerp(transform.rotationZ, 0, easedT);

  return { position, scale, rotationZ };
}
