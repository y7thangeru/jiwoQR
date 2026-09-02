import { JiwoQREntity, createJiwoQR, EncodeOptions } from '@jiwoqr/core';
import { JiwoWebGPUPipeline } from './pipeline.js';
import {
  createMat4,
  mat4LookAt,
  mat4Perspective,
  mat4Multiply,
  Mat4,
} from './math/mat4.js';
import { WebGPURendererOptions, WebGPURenderModel } from './types.js';

/**
 * First-Class Native WebGPU Renderer for JiwoQR.
 * Provides high-performance hardware-accelerated 3D procedural QR code visualization with WGSL shaders.
 */
export class JiwoWebGPURenderer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private pipeline: JiwoWebGPUPipeline;
  private currentEntity?: JiwoQREntity;

  private mode: '3d' | 'scan' = '3d';
  private model: WebGPURenderModel = 'architecture';

  // Camera Orbit State
  private azimuth = Math.PI / 4; // 45 deg
  private polar = Math.PI / 3;   // 60 deg
  private distance = 45;
  private targetAzimuth = Math.PI / 4;
  private targetPolar = Math.PI / 3;
  private targetDistance = 45;

  // Morph Transition State
  private morphProgress = 0; // 0 = 3D, 1 = 2D scan
  private targetMorphProgress = 0;
  private isMorphing = false;
  private morphStartTime = 0;
  private morphStartProgress = 0;
  private morphDuration = 800; // ms

  // Matrices
  private projMatrix: Mat4 = createMat4();
  private viewMatrix: Mat4 = createMat4();
  private mvpMatrix: Mat4 = createMat4();

  // Interaction
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private animFrameId = 0;
  private isDisposed = false;
  private resizeObserver?: ResizeObserver;

  constructor(options: WebGPURendererOptions) {
    if (options.container) {
      this.container = options.container;
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';
      this.canvas.style.touchAction = 'none';
      this.container.appendChild(this.canvas);
    } else if (options.canvas) {
      this.canvas = options.canvas;
      this.container = this.canvas.parentElement || document.body;
    } else {
      throw new Error('Either container or canvas must be provided to JiwoWebGPURenderer');
    }

    this.pipeline = new JiwoWebGPUPipeline();
    this.morphDuration = options.morphDuration ?? 800;

    this.initPipeline(options);
    this.setupInteractions();
    this.setupResizeObserver();
  }

  private async initPipeline(options: WebGPURendererOptions): Promise<void> {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(300, Math.floor(rect.height * dpr));

    await this.pipeline.initialize({
      canvas: this.canvas,
      powerPreference: options.powerPreference,
    });

    if (this.currentEntity) {
      this.pipeline.updateEntity(this.currentEntity);
    }

    this.startLoop();
  }

  public setData(value: string, options?: EncodeOptions): void {
    const entity = createJiwoQR(value, options);
    this.setEntity(entity);
  }

  public setEntity(entity: JiwoQREntity): void {
    this.currentEntity = entity;
    this.pipeline.updateEntity(entity);

    // Auto-adjust camera distance based on QR total module count
    const totalSize = entity.matrix.totalSize;
    this.distance = totalSize * 1.55;
    this.targetDistance = this.distance;
  }

  public setMode(mode: '3d' | 'scan'): void {
    this.mode = mode;
    this.targetMorphProgress = mode === 'scan' ? 1.0 : 0.0;
    this.morphStartTime = performance.now();
    this.morphStartProgress = this.morphProgress;
    this.isMorphing = true;

    if (mode === 'scan') {
      // Orthogonal top-down scan orientation
      this.targetPolar = 0.01;
      this.targetAzimuth = 0;
    } else {
      // Isometric 3D viewing angle
      this.targetPolar = Math.PI / 3.2;
      this.targetAzimuth = Math.PI / 4;
    }
  }

  public setMorphProgress(progress: number): void {
    this.morphProgress = Math.max(0, Math.min(1, progress));
    this.targetMorphProgress = this.morphProgress;
    this.isMorphing = false;
    this.mode = this.morphProgress >= 0.95 ? 'scan' : '3d';
  }

  public getMorphProgress(): number {
    return this.morphProgress;
  }

  public getMode(): '3d' | 'scan' {
    return this.mode;
  }

  public getModel(): WebGPURenderModel {
    return this.model;
  }

  private setupInteractions(): void {
    const onPointerDown = (e: PointerEvent) => {
      if (this.mode === 'scan') return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging || this.mode === 'scan') return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.targetAzimuth -= dx * 0.008;
      this.targetPolar = Math.max(0.1, Math.min(Math.PI / 2.05, this.targetPolar - dy * 0.008));
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isDragging = false;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (this.mode === 'scan') return;
      this.targetDistance = Math.max(15, Math.min(120, this.targetDistance + e.deltaY * 0.05));
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerup', onPointerUp);
    this.canvas.addEventListener('wheel', onWheel, { passive: false });
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.resize(width, height);
        }
      }
    });

    this.resizeObserver.observe(this.container);
  }

  public resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(100, Math.floor(width * dpr));
    const targetH = Math.max(100, Math.floor(height * dpr));

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.pipeline.resize(targetW, targetH);
    }
  }

  private startLoop(): void {
    const loop = (now: number) => {
      if (this.isDisposed) return;

      // Handle morph easing animation
      if (this.isMorphing) {
        const elapsed = now - this.morphStartTime;
        const t = Math.min(1, elapsed / this.morphDuration);
        this.morphProgress = this.morphStartProgress + (this.targetMorphProgress - this.morphStartProgress) * t;

        if (t >= 1) {
          this.morphProgress = this.targetMorphProgress;
          this.isMorphing = false;
        }
      }

      // Smooth camera interpolation
      const damp = 0.12;
      this.azimuth += (this.targetAzimuth - this.azimuth) * damp;
      this.polar += (this.targetPolar - this.polar) * damp;
      this.distance += (this.targetDistance - this.distance) * damp;

      // Compute camera eye in spherical coordinates
      const eyeX = this.distance * Math.sin(this.polar) * Math.sin(this.azimuth);
      const eyeY = -this.distance * Math.sin(this.polar) * Math.cos(this.azimuth);
      const eyeZ = this.distance * Math.cos(this.polar);

      const aspect = this.canvas.width / (this.canvas.height || 1);
      mat4Perspective(this.projMatrix, (45 * Math.PI) / 180, aspect, 0.5, 300);
      mat4LookAt(this.viewMatrix, [eyeX, eyeY, eyeZ], [0, 0, 0], [0, 0, 1]);
      mat4Multiply(this.mvpMatrix, this.projMatrix, this.viewMatrix);

      // Render WebGPU frame
      this.pipeline.render(this.mvpMatrix, this.morphProgress, now * 0.001);

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.pipeline.dispose();
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
