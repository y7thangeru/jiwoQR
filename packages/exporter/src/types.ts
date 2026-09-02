export type STLArchetypeModel = 'architecture' | 'globe' | 'circuit' | 'biomorphic' | 'city' | 'flat';


export interface STLExportOptions {
  /** Visual model archetype for 3D printing height extrusion (default 'architecture') */
  model?: STLArchetypeModel;
  /** Size in mm of each module block (default 2.0 mm) */
  moduleSize?: number;
  /** Thickness in mm of the solid base substrate plate (default 2.0 mm) */
  baseThickness?: number;
  /** Maximum height in mm for tallest buildings/features (default 6.0 mm) */
  maxHeight?: number;
  /** Height in mm for flat mode modules (default 2.0 mm) */
  moduleHeight?: number;
  /** Custom base plate padding in module units (default 0, quiet zone is already in totalSize) */
  padding?: number;
}


export interface GLBExportOptions {
  /** Export as binary GLB buffer (default true) */
  binary?: boolean;
  /** Include custom animations if present */
  animations?: THREE.AnimationClip[];
  /** Only export visible objects (default true) */
  onlyVisible?: boolean;
}

export interface SVGExportOptions {
  /** Target pixel dimensions of the SVG viewBox (default 1024) */
  size?: number;
  /** Dark module color (default '#000000') */
  darkColor?: string;
  /** Light background / quiet zone color (default '#ffffff') */
  lightColor?: string;
  /** Corner radius in module units (0 to 0.5, default 0) */
  borderRadius?: number;
}

export interface PNGExportOptions {
  /** Target pixel width and height (default 2048 for high-res 300 DPI print) */
  size?: number;
  /** Dark module color (default '#000000') */
  darkColor?: string;
  /** Light background / quiet zone color (default '#ffffff') */
  lightColor?: string;
}
