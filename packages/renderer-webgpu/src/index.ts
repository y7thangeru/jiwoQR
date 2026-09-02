export * from './types.js';
export * from './math/mat4.js';
export * from './shaders/architecture.wgsl.js';
export * from './pipeline.js';
export * from './renderer.js';

export const isWebGPUSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

