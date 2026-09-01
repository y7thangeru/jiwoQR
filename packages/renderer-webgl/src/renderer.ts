import * as THREE from 'three';
import { JiwoQREntity, createJiwoQR } from '@jiwoqr/core';
import { JiwoRendererOptions, RenderMode, RenderModel } from './types.js';
import { createArchitectureModel, ArchitectureModelInstance } from './models/architecture.js';
import { createGlobeModel, GlobeModelInstance } from './models/globe.js';
import { CameraController } from './scene/camera-controller.js';

type ActiveModelInstance = ArchitectureModelInstance | GlobeModelInstance;

export class JiwoWebGLRenderer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cameraController: CameraController;

  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private fillLight: THREE.DirectionalLight;

  private currentModelInstance?: ActiveModelInstance;
  private currentEntity?: JiwoQREntity;

  private modelType: RenderModel = 'architecture';
  private mode: RenderMode = '3d';
  private morphProgress = 0; // 0 = 3D, 1 = 2D scan mode
  private targetMorphProgress = 0;
  private morphDuration = 800; // ms
  private morphStartTime = 0;
  private morphStartProgress = 0;
  private isMorphing = false;

  private animFrameId = 0;
  private isDisposed = false;
  private resizeObserver?: ResizeObserver;

  constructor(options: JiwoRendererOptions = {}) {
    this.container = options.container ?? document.body;
    this.modelType = options.model ?? 'architecture';
    this.mode = options.mode ?? '3d';
    this.morphProgress = this.mode === 'scan' ? 1 : 0;
    this.targetMorphProgress = this.morphProgress;
    this.morphDuration = options.morphDuration ?? 800;

    // 1. Setup Canvas and Three.js Renderer
    if (options.canvas) {
      this.canvas = options.canvas;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'block';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.container.appendChild(this.canvas);
    }

    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: options.antialias ?? true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Setup Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c13);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.cameraController = new CameraController(this.camera, this.canvas);

    // 3. Setup Lights (User Note 3: High contrast & shadow mitigation)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.directionalLight.position.set(30, -40, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 200;
    const d = 40;
    this.directionalLight.shadow.camera.left = -d;
    this.directionalLight.shadow.camera.right = d;
    this.directionalLight.shadow.camera.top = d;
    this.directionalLight.shadow.camera.bottom = -d;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    this.fillLight = new THREE.DirectionalLight(0x00f0ff, 0.5);
    this.fillLight.position.set(-30, 40, 30);
    this.scene.add(this.fillLight);

    // 4. Resize Handling
    this.setupResize();

    // 5. Start Render Loop
    this.renderLoop = this.renderLoop.bind(this);
    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  public setData(payload: string) {
    this.currentEntity = createJiwoQR(payload);
    this.buildModel();
  }

  public setEntity(entity: JiwoQREntity) {
    this.currentEntity = entity;
    this.buildModel();
  }

  private buildModel() {
    if (!this.currentEntity) return;

    if (this.currentModelInstance) {
      this.scene.remove(this.currentModelInstance.group);
      this.currentModelInstance.dispose();
      this.currentModelInstance = undefined;
    }

    if (this.modelType === 'architecture') {
      this.currentModelInstance = createArchitectureModel(
        this.currentEntity.matrix,
        this.currentEntity.dna
      );
    } else if (this.modelType === 'globe') {
      this.currentModelInstance = createGlobeModel(
        this.currentEntity.matrix,
        this.currentEntity.dna
      );
    }

    if (this.currentModelInstance) {
      this.scene.add(this.currentModelInstance.group);

      const bounds = this.currentModelInstance.getQRWorldBounds();
      this.cameraController.setBounds(bounds.width);
      this.currentModelInstance.update(this.morphProgress);

      // Set scene background color to match DNA palette
      if (this.mode === '3d') {
        this.scene.background = new THREE.Color(this.currentEntity.dna.palette.background);
      }
    }
  }

  /**
   * Switches the active 3D visual archetype ('architecture' | 'globe')
   */
  public setModel(model: RenderModel) {
    if (this.modelType === model) return;
    this.modelType = model;
    this.buildModel();
  }

  public getModel(): RenderModel {
    return this.modelType;
  }

  /**
   * Triggers smooth transition between '3d' and 'scan' mode
   */
  public setMode(mode: RenderMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.targetMorphProgress = mode === 'scan' ? 1.0 : 0.0;
    this.morphStartProgress = this.morphProgress;
    this.morphStartTime = performance.now();
    this.isMorphing = true;
  }

  /**
   * Manually scrubs the morph progress [0.0 = 3D, 1.0 = Scan]
   */
  public setMorphProgress(progress: number) {
    this.isMorphing = false;
    this.morphProgress = Math.max(0, Math.min(1, progress));
    this.mode = this.morphProgress > 0.5 ? 'scan' : '3d';
    this.applyMorph();
  }

  private applyMorph() {
    if (this.currentModelInstance) {
      this.currentModelInstance.update(this.morphProgress);
    }

    // User Note 3: Lighting & shadow mitigation in scan mode
    // When in scan mode (t -> 1), eliminate directional shadows and harsh glares
    const t = this.morphProgress;
    this.directionalLight.castShadow = t < 0.85;
    this.directionalLight.intensity = (1.0 - t * 0.7) * 1.8;
    this.fillLight.intensity = (1.0 - t) * 0.5;
    this.ambientLight.intensity = 0.45 + t * 0.55;

    // Background color transition: in scan mode, background is clean pure white or dark contrast
    if (this.currentEntity) {
      const bg3D = new THREE.Color(this.currentEntity.dna.palette.background);
      const bgScan = new THREE.Color(0xffffff);
      (this.scene.background as THREE.Color).copy(bg3D).lerp(bgScan, t);
    }
  }

  private setupResize() {
    if (typeof ResizeObserver !== 'undefined') {
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
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private renderLoop(time: number) {
    if (this.isDisposed) return;

    // Animate morphing
    if (this.isMorphing) {
      const elapsed = time - this.morphStartTime;
      const progress = Math.min(1, elapsed / this.morphDuration);
      this.morphProgress =
        this.morphStartProgress + (this.targetMorphProgress - this.morphStartProgress) * progress;

      this.applyMorph();

      if (progress >= 1) {
        this.isMorphing = false;
        this.morphProgress = this.targetMorphProgress;
        this.applyMorph();
      }
    }

    // Update camera controller
    this.cameraController.update(this.morphProgress);

    // Render Three.js scene
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  }

  public getEntity(): JiwoQREntity | undefined {
    return this.currentEntity;
  }

  public getMode(): RenderMode {
    return this.mode;
  }

  public getMorphProgress(): number {
    return this.morphProgress;
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    this.resizeObserver?.disconnect();
    this.cameraController.detachEvents();

    if (this.currentModelInstance) {
      this.currentModelInstance.dispose();
    }

    this.renderer.dispose();
    if (this.canvas.parentElement === this.container && this.canvas !== this.container) {
      this.canvas.remove();
    }
  }
}
