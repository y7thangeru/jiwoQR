import { QRMatrix, DeterministicDNA } from '@jiwoqr/core';
import {
  computeExtrusionTransform,
  computeGlobeModuleTransform,
  computeCircuitModuleTransform,
} from '@jiwoqr/math';
import { STLExportOptions } from './types.js';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Triangle {
  normal: Point3D;
  v1: Point3D;
  v2: Point3D;
  v3: Point3D;
}

function addBoxTriangles(
  triangles: Triangle[],
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
) {
  const v0: Point3D = { x: x1, y: y1, z: z1 };
  const v1: Point3D = { x: x2, y: y1, z: z1 };
  const v2: Point3D = { x: x2, y: y2, z: z1 };
  const v3: Point3D = { x: x1, y: y2, z: z1 };
  const v4: Point3D = { x: x1, y: y1, z: z2 };
  const v5: Point3D = { x: x2, y: y1, z: z2 };
  const v6: Point3D = { x: x2, y: y2, z: z2 };
  const v7: Point3D = { x: x1, y: y2, z: z2 };

  // Bottom (-Z)
  triangles.push({ normal: { x: 0, y: 0, z: -1 }, v1: v0, v2: v2, v3: v1 });
  triangles.push({ normal: { x: 0, y: 0, z: -1 }, v1: v0, v2: v3, v3: v2 });

  // Top (+Z)
  triangles.push({ normal: { x: 0, y: 0, z: 1 }, v1: v4, v2: v5, v3: v6 });
  triangles.push({ normal: { x: 0, y: 0, z: 1 }, v1: v4, v2: v6, v3: v7 });

  // Front (-Y)
  triangles.push({ normal: { x: 0, y: -1, z: 0 }, v1: v0, v2: v1, v3: v5 });
  triangles.push({ normal: { x: 0, y: -1, z: 0 }, v1: v0, v2: v5, v3: v4 });

  // Back (+Y)
  triangles.push({ normal: { x: 0, y: 1, z: 0 }, v1: v3, v2: v6, v3: v2 });
  triangles.push({ normal: { x: 0, y: 1, z: 0 }, v1: v3, v2: v7, v3: v6 });

  // Left (-X)
  triangles.push({ normal: { x: -1, y: 0, z: 0 }, v1: v0, v2: v4, v3: v7 });
  triangles.push({ normal: { x: -1, y: 0, z: 0 }, v1: v0, v2: v7, v3: v3 });

  // Right (+X)
  triangles.push({ normal: { x: 1, y: 0, z: 0 }, v1: v1, v2: v2, v3: v6 });
  triangles.push({ normal: { x: 1, y: 0, z: 0 }, v1: v1, v2: v6, v3: v5 });
}

/**
 * Generates a 3D-printing ready, manifold / watertight binary STL file from a QR matrix and visual DNA.
 * Faithfully extrudes the 3D procedural skyscraper city, voxel globe mound, or circuit PCB components
 * on top of a solid base substrate plate.
 */
export function exportSTL(
  matrix: QRMatrix,
  dna?: DeterministicDNA,
  options: STLExportOptions = {}
): ArrayBuffer {
  const model = options.model ?? (dna ? 'architecture' : 'flat');
  const moduleSize = options.moduleSize ?? 2.0; // mm
  const baseThickness = options.baseThickness ?? 2.0; // mm
  const totalModules = matrix.totalSize;

  const totalWidth = totalModules * moduleSize;
  const totalHeight = totalModules * moduleSize;

  const triangles: Triangle[] = [];

  // 1. Solid Base Substrate Plate (Watertight Box)
  // Base plate spans from z = 0 to z = baseThickness
  addBoxTriangles(triangles, 0, 0, 0, totalWidth, totalHeight, baseThickness);

  // 2. Procedural 3D Raised Modules (Skyscrapers / Globe / Circuit / Flat)
  const seed32 = dna?.seed32 ?? 12345;

  for (let y = 0; y < totalModules; y++) {
    for (let x = 0; x < totalModules; x++) {
      const mod = matrix.grid[y][x];
      if (!mod.isDark) continue;

      const isFinder = mod.type === 'FINDER';
      const x1 = x * moduleSize;
      const y1 = (totalModules - 1 - y) * moduleSize; // Upright mapping
      let x2 = x1 + moduleSize;
      let y2 = y1 + moduleSize;
      let moduleHeight = options.moduleHeight ?? 2.0;

      if (model === 'architecture') {
        const archMaxHeight = options.maxHeight ?? (dna?.architecture.maxHeight ? dna.architecture.maxHeight * 2.0 : 6.0);
        const transform = computeExtrusionTransform(
          mod.x,
          mod.y,
          totalModules,
          true,
          isFinder,
          seed32,
          {
            moduleSize,
            gap: 0,
            maxHeight: archMaxHeight,
            heightVariance: dna?.architecture.heightVariance ?? 0.6,
            landmarkMultiplier: 1.75, // Tall landmark finder towers
          }
        );
        moduleHeight = Math.max(1.0, transform.scale3D.z);
      } else if (model === 'globe') {
        const globeMaxHeight = options.maxHeight ?? 8.0;
        const transform = computeGlobeModuleTransform(
          mod.x,
          mod.y,
          totalModules,
          true,
          isFinder,
          seed32,
          {
            moduleSize,
            gap: 0,
            maxHeight: globeMaxHeight,
            finderElevationMultiplier: 1.25,
          }
        );
        moduleHeight = Math.max(1.0, transform.scale3D.z);
      } else if (model === 'circuit') {
        const transform = computeCircuitModuleTransform(
          mod.x,
          mod.y,
          totalModules,
          true,
          isFinder,
          seed32,
          {
            moduleSize,
            gap: 0,
            chipElevation: options.maxHeight ? options.maxHeight * 0.8 : 4.5,
          }
        );
        moduleHeight = Math.max(0.8, transform.scale3D.z * 4.0);
        x2 = x1 + Math.max(0.8, transform.scale3D.x * moduleSize);
        y2 = y1 + Math.max(0.8, transform.scale3D.y * moduleSize);
      }

      const z1 = baseThickness;
      const z2 = baseThickness + moduleHeight;

      addBoxTriangles(triangles, x1, y1, z1, x2, y2, z2);
    }
  }

  // 3. Encode to Binary STL format
  const numTriangles = triangles.length;
  const bufferSize = 80 + 4 + numTriangles * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // 80-byte header
  const headerStr = `JiwoQR 3D-Printable STL (${model.toUpperCase()}) - Watertight Solid Manifold`;
  for (let i = 0; i < 80; i++) {
    dataView.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 0x20);
  }

  // 4-byte uint32 triangle count (Little-Endian)
  dataView.setUint32(80, numTriangles, true);

  // Triangle records
  let offset = 84;
  for (const tri of triangles) {
    // Normal vector (3x float32)
    dataView.setFloat32(offset, tri.normal.x, true);
    dataView.setFloat32(offset + 4, tri.normal.y, true);
    dataView.setFloat32(offset + 8, tri.normal.z, true);

    // Vertex 1 (3x float32)
    dataView.setFloat32(offset + 12, tri.v1.x, true);
    dataView.setFloat32(offset + 16, tri.v1.y, true);
    dataView.setFloat32(offset + 20, tri.v1.z, true);

    // Vertex 2 (3x float32)
    dataView.setFloat32(offset + 24, tri.v2.x, true);
    dataView.setFloat32(offset + 28, tri.v2.y, true);
    dataView.setFloat32(offset + 32, tri.v2.z, true);

    // Vertex 3 (3x float32)
    dataView.setFloat32(offset + 36, tri.v3.x, true);
    dataView.setFloat32(offset + 40, tri.v3.y, true);
    dataView.setFloat32(offset + 44, tri.v3.z, true);

    // Attribute byte count (uint16 = 0)
    dataView.setUint16(offset + 48, 0, true);

    offset += 50;
  }

  return buffer;
}
