import { JiwoQREntity } from '@jiwoqr/core';
import { computeExtrusionTransform } from '@jiwoqr/math';
import { ARCHITECTURE_WGSL } from './shaders/architecture.wgsl.js';
import { Mat4 } from './math/mat4.js';
import { WebGPURendererOptions } from './types.js';

/**
 * Creates unit cube vertices with normals centered at (0, 0) and sitting on Z = 0.
 * Format: [px, py, pz, nx, ny, nz] (6 floats per vertex, 24 bytes).
 */
function createUnitCubeData(): { vertices: Float32Array; indices: Uint16Array } {
  // 24 vertices for 6 faces with distinct normal vectors
  const v = [
    // Front face (-Y)
    -0.5, -0.5, 0.0,  0, -1, 0,
     0.5, -0.5, 0.0,  0, -1, 0,
     0.5, -0.5, 1.0,  0, -1, 0,
    -0.5, -0.5, 1.0,  0, -1, 0,

    // Back face (+Y)
     0.5,  0.5, 0.0,  0,  1, 0,
    -0.5,  0.5, 0.0,  0,  1, 0,
    -0.5,  0.5, 1.0,  0,  1, 0,
     0.5,  0.5, 1.0,  0,  1, 0,

    // Top face (+Z)
    -0.5, -0.5, 1.0,  0,  0, 1,
     0.5, -0.5, 1.0,  0,  0, 1,
     0.5,  0.5, 1.0,  0,  0, 1,
    -0.5,  0.5, 1.0,  0,  0, 1,

    // Bottom face (-Z)
    -0.5,  0.5, 0.0,  0,  0, -1,
     0.5,  0.5, 0.0,  0,  0, -1,
     0.5, -0.5, 0.0,  0,  0, -1,
    -0.5, -0.5, 0.0,  0,  0, -1,

    // Right face (+X)
     0.5, -0.5, 0.0,  1,  0, 0,
     0.5,  0.5, 0.0,  1,  0, 0,
     0.5,  0.5, 1.0,  1,  0, 0,
     0.5, -0.5, 1.0,  1,  0, 0,

    // Left face (-X)
    -0.5,  0.5, 0.0, -1,  0, 0,
    -0.5, -0.5, 0.0, -1,  0, 0,
    -0.5, -0.5, 1.0, -1,  0, 0,
    -0.5,  0.5, 1.0, -1,  0, 0,
  ];

  const idx = [
    0, 1, 2,  0, 2, 3,       // Front
    4, 5, 6,  4, 6, 7,       // Back
    8, 9, 10, 8, 10, 11,     // Top
    12, 13, 14, 12, 14, 15,  // Bottom
    16, 17, 18, 16, 18, 19,  // Right
    20, 21, 22, 20, 22, 23,  // Left
  ];

  return {
    vertices: new Float32Array(v),
    indices: new Uint16Array(idx),
  };
}

function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return [r, g, b];
  }
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

/**
 * First-Class Native WebGPU Render & Compute Pipeline for JiwoQR Architecture Archetype.
 */
export class JiwoWebGPUPipeline {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private pipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  private vertexBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private uniformBuffer!: GPUBuffer;
  private instanceBuffer!: GPUBuffer;
  private bindGroup!: GPUBindGroup;

  private instanceCount = 0;
  private isInitialized = false;

  public async initialize(options: WebGPURendererOptions): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      throw new Error('WebGPU is not supported by this browser environment');
    }

    if (!options.canvas) {
      throw new Error('Canvas element is required to initialize WebGPU pipeline');
    }
    const canvas = options.canvas;

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: options.powerPreference ?? 'high-performance',
    });

    if (!adapter) {
      throw new Error('Could not obtain a WebGPU adapter');
    }

    this.device = (options.device as GPUDevice) || (await adapter.requestDevice());
    this.context = canvas.getContext('webgpu') as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    this.recreateDepthTexture(canvas.width, canvas.height);

    // Create WGSL Shader Module
    const shaderModule = this.device.createShaderModule({
      label: 'JiwoQR Architecture WGSL Shader',
      code: ARCHITECTURE_WGSL,
    });

    // Create Render Pipeline
    this.pipeline = this.device.createRenderPipeline({
      label: 'JiwoQR Architecture Render Pipeline',
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 24, // 6 floats * 4 bytes
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },  // position
              { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });

    // Setup Unit Cube Geometry Buffers
    const cubeData = createUnitCubeData();

    this.vertexBuffer = this.device.createBuffer({
      label: 'Unit Cube Vertex Buffer',
      size: cubeData.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, cubeData.vertices.buffer as ArrayBuffer);

    this.indexBuffer = this.device.createBuffer({
      label: 'Unit Cube Index Buffer',
      size: cubeData.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, cubeData.indices.buffer as ArrayBuffer);

    // Uniform buffer (MVP: 64 bytes, morph: 4 bytes, time: 4 bytes, pad: 8 bytes = 80 bytes)
    this.uniformBuffer = this.device.createBuffer({
      label: 'Architecture Uniforms Buffer',
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.isInitialized = true;
  }

  public resize(width: number, height: number): void {
    if (!this.isInitialized) return;
    this.recreateDepthTexture(width, height);
  }

  private recreateDepthTexture(width: number, height: number): void {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    this.depthTexture = this.device.createTexture({
      size: [Math.max(1, width), Math.max(1, height)],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  /**
   * Uploads dark module positions and morph targets into WebGPU Storage Buffer.
   */
  public updateEntity(entity: JiwoQREntity): void {
    if (!this.isInitialized) return;

    const matrix = entity.matrix;
    const dna = entity.dna;
    const totalGridSize = matrix.totalSize;

    // Collect all dark modules
    const darkCoords: { x: number; y: number; isFinder: boolean }[] = [];
    for (let y = 0; y < totalGridSize; y++) {
      for (let x = 0; x < totalGridSize; x++) {
        const mod = matrix.grid[y][x];
        if (mod.isDark) {
          darkCoords.push({ x, y, isFinder: mod.type === 'FINDER' });
        }
      }
    }

    this.instanceCount = darkCoords.length;
    if (this.instanceCount === 0) return;

    // Each instance struct = 24 floats (96 bytes)
    const floatData = new Float32Array(this.instanceCount * 24);

    const primRGB = hexToRGB(dna.palette.primary);
    const secRGB = hexToRGB(dna.palette.secondary);
    const accRGB = hexToRGB(dna.palette.accent);
    const findRGB = hexToRGB(dna.palette.finderEmissive);

    for (let i = 0; i < this.instanceCount; i++) {
      const { x, y, isFinder } = darkCoords[i];
      const transform = computeExtrusionTransform(
        x,
        y,
        totalGridSize,
        true,
        isFinder,
        dna.seed32,
        {
          moduleSize: 1.0,
          gap: 0.04,
          maxHeight: dna.architecture.maxHeight,
          heightVariance: dna.architecture.heightVariance,
        }
      );

      const offset = i * 24;

      // 1. pos3D (xyz, w = height3D)
      floatData[offset + 0] = transform.position3D.x;
      floatData[offset + 1] = transform.position3D.y;
      floatData[offset + 2] = transform.position3D.z;
      floatData[offset + 3] = transform.scale3D.z;

      // 2. pos2D (xyz, w = height2D)
      floatData[offset + 4] = transform.position2D.x;
      floatData[offset + 5] = transform.position2D.y;
      floatData[offset + 6] = transform.position2D.z;
      floatData[offset + 7] = transform.scale2D.z;

      // 3. scale3D (xyz, w = rotationZ)
      floatData[offset + 8] = transform.scale3D.x;
      floatData[offset + 9] = transform.scale3D.y;
      floatData[offset + 10] = transform.scale3D.z;
      floatData[offset + 11] = 0; // rotation

      // 4. scale2D (xyz, w = 0)
      floatData[offset + 12] = transform.scale2D.x;
      floatData[offset + 13] = transform.scale2D.y;
      floatData[offset + 14] = transform.scale2D.z;
      floatData[offset + 15] = 0;

      // 5. color3D (rgba)
      if (isFinder) {
        floatData[offset + 16] = findRGB[0];
        floatData[offset + 17] = findRGB[1];
        floatData[offset + 18] = findRGB[2];
      } else {
        const hash = (x * 13 + y * 29 + dna.seed32) % 10;
        const col = hash < 5 ? primRGB : hash < 8 ? secRGB : accRGB;
        floatData[offset + 16] = col[0];
        floatData[offset + 17] = col[1];
        floatData[offset + 18] = col[2];
      }
      floatData[offset + 19] = 1.0;

      // 6. color2D (pure black for canonical scanability)
      floatData[offset + 20] = 0.0;
      floatData[offset + 21] = 0.0;
      floatData[offset + 22] = 0.0;
      floatData[offset + 23] = 1.0;
    }

    if (this.instanceBuffer) {
      this.instanceBuffer.destroy();
    }

    this.instanceBuffer = this.device.createBuffer({
      label: 'Architecture Instance Storage Buffer',
      size: floatData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.instanceBuffer, 0, floatData.buffer as ArrayBuffer);

    // Bind Group: Uniforms + Instances
    this.bindGroup = this.device.createBindGroup({
      label: 'Architecture Bind Group',
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: this.instanceBuffer },
        },
      ],
    });
  }

  /**
   * Executes the native WebGPU Render Pass.
   */
  public render(mvpMatrix: Mat4, morphProgress: number, time: number = 0): void {
    if (!this.isInitialized || this.instanceCount === 0 || !this.bindGroup) return;

    // Update uniform buffer: MVP Matrix (64 bytes) + morphProgress (4 bytes) + time (4 bytes) + pad (8 bytes)
    const uniformData = new Float32Array(20);
    uniformData.set(mvpMatrix, 0);
    uniformData[16] = morphProgress;
    uniformData[17] = time;
    uniformData[18] = 0;
    uniformData[19] = 0;
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer as ArrayBuffer);

    const commandEncoder = this.device.createCommandEncoder({
      label: 'JiwoQR Architecture Command Encoder',
    });

    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      label: 'JiwoQR Architecture Render Pass',
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.04, g: 0.05, b: 0.08, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
    renderPass.drawIndexed(36, this.instanceCount);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public dispose(): void {
    if (this.vertexBuffer) this.vertexBuffer.destroy();
    if (this.indexBuffer) this.indexBuffer.destroy();
    if (this.uniformBuffer) this.uniformBuffer.destroy();
    if (this.instanceBuffer) this.instanceBuffer.destroy();
    if (this.depthTexture) this.depthTexture.destroy();
    this.isInitialized = false;
  }
}
