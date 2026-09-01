import * as THREE from 'three';
import { easeInOutCubic } from '@jiwoqr/math';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // Orbit angles for 3D interactive mode
  public spherical = {
    radius: 50,
    phi: Math.PI / 3.5, // ~51 degrees from vertical
    theta: Math.PI / 4, // 45 degrees
  };

  private targetSpherical = { ...this.spherical };
  private baseRadius = 50;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onWheel = this.onWheel.bind(this);

    this.attachEvents();
  }

  public setBounds(worldSize: number) {
    // Calculate camera distance to fit the QR code neatly in FOV
    const fovRad = (this.camera.fov * Math.PI) / 180;
    this.baseRadius = (worldSize / 2 / Math.tan(fovRad / 2)) * 1.35;
    this.spherical.radius = this.baseRadius;
    this.targetSpherical.radius = this.baseRadius;
  }

  private attachEvents() {
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: true });
  }

  public detachEvents() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }

  private onPointerDown(e: PointerEvent) {
    this.isDragging = true;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.prevMouseX;
    const deltaY = e.clientY - this.prevMouseY;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;

    const rotateSpeed = 0.005;
    this.targetSpherical.theta -= deltaX * rotateSpeed;
    this.targetSpherical.phi -= deltaY * rotateSpeed;

    // Clamp vertical angle to avoid flipping
    this.targetSpherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this.targetSpherical.phi));
  }

  private onPointerUp() {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    const zoomSpeed = 0.05;
    this.targetSpherical.radius += e.deltaY * zoomSpeed;
    this.targetSpherical.radius = Math.max(
      this.baseRadius * 0.4,
      Math.min(this.baseRadius * 2.5, this.targetSpherical.radius)
    );
  }

  /**
   * Updates camera position based on morph progress t (0 = 3D orbit, 1 = top-down 2D scan view)
   */
  public update(morphProgress: number, damping = 0.1) {
    // Smooth damping for 3D orbit
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * damping;
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * damping;
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * damping;

    const easedT = easeInOutCubic(morphProgress);

    // 3D position in spherical coordinates (Z is up in QR model space)
    const sinPhi = Math.sin(this.spherical.phi);
    const cosPhi = Math.cos(this.spherical.phi);
    const sinTheta = Math.sin(this.spherical.theta);
    const cosTheta = Math.cos(this.spherical.theta);

    const x3D = this.spherical.radius * sinPhi * sinTheta;
    const y3D = -this.spherical.radius * sinPhi * cosTheta;
    const z3D = this.spherical.radius * cosPhi;

    // 2D position directly above origin looking down the +Z axis
    const x2D = 0;
    const y2D = 0;
    const z2D = this.baseRadius * 0.95;

    // Interpolate camera position
    this.camera.position.x = x3D + (x2D - x3D) * easedT;
    this.camera.position.y = y3D + (y2D - y3D) * easedT;
    this.camera.position.z = z3D + (z2D - z3D) * easedT;

    // In top-down view (t = 1), +Y points up on the screen
    const up3D = new THREE.Vector3(0, 0, 1);
    const up2D = new THREE.Vector3(0, 1, 0);
    this.camera.up.copy(up3D).lerp(up2D, easedT).normalize();

    this.camera.lookAt(0, 0, 0);
  }
}
