import { QRMatrix } from '@jiwoqr/core';

/**
 * Checks whether the current runtime environment supports WebGL / WebGL2 context creation.
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export interface FallbackRenderOptions {
  darkColor?: string;
  lightColor?: string;
}

/**
 * Renders a canonical high-contrast 2D QR code onto a Canvas 2D context for zero-WebGL environments.
 */
export function render2DFallbackCanvas(
  canvas: HTMLCanvasElement,
  matrix: QRMatrix,
  options: FallbackRenderOptions = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const darkColor = options.darkColor ?? '#000000';
  const lightColor = options.lightColor ?? '#ffffff';

  const totalModules = matrix.totalSize;
  const width = canvas.width || 300;
  const height = canvas.height || 300;
  const size = Math.min(width, height);
  const modulePixelSize = size / totalModules;
  const offsetX = (width - size) / 2;
  const offsetY = (height - size) / 2;

  // Background (Quiet Zone & Light Modules)
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, width, height);

  // Dark Modules
  ctx.fillStyle = darkColor;
  for (let y = 0; y < totalModules; y++) {
    for (let x = 0; x < totalModules; x++) {
      const mod = matrix.grid[y][x];
      if (mod.isDark) {
        ctx.fillRect(
          Math.floor(offsetX + x * modulePixelSize),
          Math.floor(offsetY + y * modulePixelSize),
          Math.ceil(modulePixelSize),
          Math.ceil(modulePixelSize)
        );
      }
    }
  }
}
