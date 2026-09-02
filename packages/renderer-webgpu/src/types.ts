import { JiwoQREntity } from '@jiwoqr/core';

export type WebGPUPowerPreference = 'low-power' | 'high-performance';
export type WebGPURenderModel = 'architecture';

export interface WebGPURendererOptions {
  canvas?: HTMLCanvasElement;
  container?: HTMLElement;
  device?: unknown;
  powerPreference?: WebGPUPowerPreference;
  morphDuration?: number;
  model?: WebGPURenderModel;
}

export interface WebGPURendererPipeline {
  initialize(options: { canvas: HTMLCanvasElement; powerPreference?: WebGPUPowerPreference; device?: unknown }): Promise<void>;
  dispose(): void;
}

