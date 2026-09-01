export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ExtrusionModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  /** 3D isometric architecture mode position */
  position3D: Vec3;
  /** 2D canonical scan mode position */
  position2D: Vec3;
  /** Scale in 3D mode (x, y, heightZ) */
  scale3D: Vec3;
  /** Scale in 2D mode (x, y, 0.01) */
  scale2D: Vec3;
}

export interface SpherifiedModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  isFinder: boolean;
  /** 3D spherical position */
  position3D: Vec3;
  /** Surface normal at the spherical point */
  normal3D: Vec3;
  /** Scale in 3D globe mode */
  scale3D: Vec3;
  /** 2D canonical flat position */
  position2D: Vec3;
  /** Scale in 2D scan mode */
  scale2D: Vec3;
}

export type CircuitComponentType =
  | 'CHIP_IC' // Finder pattern main QFP/BGA package
  | 'CHIP_PIN' // IC lead pin
  | 'RESISTOR' // 0805 SMD resistor
  | 'CAPACITOR' // Ceramic SMD capacitor
  | 'VIA_PAD' // Gold/copper circular via or pad
  | 'TRACE_H' // Horizontal trace
  | 'TRACE_V'; // Vertical trace

export interface CircuitModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  isFinder: boolean;
  componentType: CircuitComponentType;
  /** 3D PCB elevation position */
  position3D: Vec3;
  /** 2D canonical flat position */
  position2D: Vec3;
  /** Scale in 3D circuit mode */
  scale3D: Vec3;
  /** Scale in 2D scan mode */
  scale2D: Vec3;
  /** Rotation in 3D mode (rad) */
  rotationZ: number;
}


