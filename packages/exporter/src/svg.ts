import { QRMatrix } from '@jiwoqr/core';
import { SVGExportOptions } from './types.js';

/**
 * Exports a QR matrix as a standalone high-resolution SVG string.
 */
export function exportSVG(matrix: QRMatrix, options: SVGExportOptions = {}): string {
  const darkColor = options.darkColor ?? '#000000';
  const lightColor = options.lightColor ?? '#ffffff';
  const borderRadius = options.borderRadius ?? 0;
  const totalModules = matrix.totalSize;

  const rects: string[] = [];

  for (let y = 0; y < totalModules; y++) {
    for (let x = 0; x < totalModules; x++) {
      const mod = matrix.grid[y][x];
      if (mod.isDark) {
        if (borderRadius > 0) {
          rects.push(
            `    <rect x="${x}" y="${y}" width="1" height="1" rx="${borderRadius}" ry="${borderRadius}" fill="${darkColor}" />`
          );
        } else {
          rects.push(`    <rect x="${x}" y="${y}" width="1" height="1" fill="${darkColor}" />`);
        }
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges" width="100%" height="100%">
  <rect width="100%" height="100%" fill="${lightColor}" />
  <g fill="${darkColor}">
${rects.join('\n')}
  </g>
</svg>`;
}
