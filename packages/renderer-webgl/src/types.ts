import * as THREE from 'three';

export type RenderModel = 'architecture' | 'globe' | 'circuit' | 'biomorphic' | 'city' | 'origami';
export type RenderMode = '3d' | 'scan';

export interface JiwoRendererOptions {
  canvas?: HTMLCanvasElement;
  container?: HTMLElement;
  model?: RenderModel;
  mode?: RenderMode;
  moduleSize?: number;
  gap?: number;
  interactive?: boolean;
  antialias?: boolean;
  morphDuration?: number; // Duration of 3D-to-2D morph transition in ms (default 800)
  cityModelUrls?: string[];
  buildingGeometries?: THREE.BufferGeometry[];
}

