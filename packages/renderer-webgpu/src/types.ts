import { JiwoQREntity } from '@jiwoqr/core';

export type WebGPUPowerPreference = 'low-power' | 'high-performance';

export interface WebGPURendererOptions {
  canvas: HTMLCanvasElement;
  device?: unknown;
  powerPreference?: WebGPUPowerPreference;
}

export interface WebGPURendererPipeline {
  initialize(options: WebGPURendererOptions): Promise<void>;
  render(entity: JiwoQREntity, morphProgress: number): void;
  dispose(): void;
}
