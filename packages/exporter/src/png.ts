import { QRMatrix } from '@jiwoqr/core';
import { PNGExportOptions } from './types.js';

/**
 * Exports a QR matrix as a high-resolution 300 DPI raster PNG Blob.
 */
export async function exportPNG(
  matrix: QRMatrix,
  options: PNGExportOptions = {}
): Promise<Blob> {
  const size = options.size ?? 2048; // Default 2048x2048 for crisp 300 DPI physical prints
  const darkColor = options.darkColor ?? '#000000';
  const lightColor = options.lightColor ?? '#ffffff';
  const totalModules = matrix.totalSize;

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D rendering context for PNG export');
    }

    // Disable image smoothing for 100% pixel-perfect sharp binary edges
    ctx.imageSmoothingEnabled = false;

    // Background
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);

    // Modules
    const moduleSize = size / totalModules;
    ctx.fillStyle = darkColor;

    for (let y = 0; y < totalModules; y++) {
      for (let x = 0; x < totalModules; x++) {
        const mod = matrix.grid[y][x];
        if (mod.isDark) {
          ctx.fillRect(
            Math.floor(x * moduleSize),
            Math.floor(y * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          );
        }
      }
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob from canvas'));
      }, 'image/png');
    });
  } else if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain OffscreenCanvas 2D context');
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);

    const moduleSize = size / totalModules;
    ctx.fillStyle = darkColor;

    for (let y = 0; y < totalModules; y++) {
      for (let x = 0; x < totalModules; x++) {
        const mod = matrix.grid[y][x];
        if (mod.isDark) {
          ctx.fillRect(
            Math.floor(x * moduleSize),
            Math.floor(y * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          );
        }
      }
    }

    return canvas.convertToBlob({ type: 'image/png' });
  }

  throw new Error('Canvas API is not available in the current environment');
}
