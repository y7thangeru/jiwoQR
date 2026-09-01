import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { encodeQR, createJiwoQR } from '@jiwoqr/core';

import { exportSTL, exportSVG, exportGLB } from '../src/index.js';

describe('@jiwoqr/exporter', () => {
  const matrix = encodeQR('JIWO-3D-PRINT', { ecc: 'M' });

  describe('3D-Printing Watertight Binary STL Exporter', () => {
    it('generates a valid binary STL buffer with watertight base plate and modules', () => {
      const buffer = exportSTL(matrix, {
        moduleSize: 2.0,
        baseThickness: 2.0,
        moduleHeight: 2.0,
      });

      expect(buffer).toBeInstanceOf(ArrayBuffer);

      const view = new DataView(buffer);
      // Check 80-byte header starts with JiwoQR
      const headerBytes = new Uint8Array(buffer, 0, 80);
      const headerStr = new TextDecoder().decode(headerBytes);
      expect(headerStr).toContain('JiwoQR');

      // Check triangle count
      const numTriangles = view.getUint32(80, true);
      expect(numTriangles).toBeGreaterThan(12);

      // Count dark modules
      let darkCount = 0;
      for (let y = 0; y < matrix.totalSize; y++) {
        for (let x = 0; x < matrix.totalSize; x++) {
          if (matrix.grid[y][x].isDark) darkCount++;
        }
      }

      // 12 triangles for base plate + 12 triangles per dark module
      const expectedTriangles = 12 + 12 * darkCount;
      expect(numTriangles).toBe(expectedTriangles);

      // Total file size = 80 + 4 + numTriangles * 50
      expect(buffer.byteLength).toBe(84 + expectedTriangles * 50);
    });

    it('generates procedural skyscraper heights matching 3D architecture DNA', () => {
      const entity = createJiwoQR('https://jiwoqr.dev/cyber-city');
      const buffer = exportSTL(entity.matrix, entity.dna, {
        model: 'architecture',
        maxHeight: 8.0,
      });

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      const view = new DataView(buffer);
      const numTriangles = view.getUint32(80, true);
      expect(numTriangles).toBeGreaterThan(12);

      // Check header string mentions ARCHITECTURE
      const headerBytes = new Uint8Array(buffer, 0, 80);
      const headerStr = new TextDecoder().decode(headerBytes);
      expect(headerStr).toContain('ARCHITECTURE');
    });

    it('generates 3D-printable STL for Circuit model', () => {
      const entity = createJiwoQR('https://jiwoqr.dev/pcb-core');
      const buffer = exportSTL(entity.matrix, entity.dna, {
        model: 'circuit',
        maxHeight: 6.0,
      });

      expect(buffer).toBeInstanceOf(ArrayBuffer);
      const headerBytes = new Uint8Array(buffer, 0, 80);
      const headerStr = new TextDecoder().decode(headerBytes);
      expect(headerStr).toContain('CIRCUIT');
    });
  });


  describe('Canonical SVG Exporter', () => {
    it('generates valid SVG markup with viewBox and crisp edges', () => {
      const svg = exportSVG(matrix, {
        darkColor: '#00ff88',
        lightColor: '#0a0c13',
        borderRadius: 0.1,
      });

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain(`viewBox="0 0 ${matrix.totalSize} ${matrix.totalSize}"`);
      expect(svg).toContain('fill="#00ff88"');
      expect(svg).toContain('fill="#0a0c13"');
      expect(svg).toContain('</svg>');
    });
  });

  describe('Three.js GLTF / GLB Exporter', () => {
    it('exports a 3D scene to binary GLB buffer', async () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff })
      );
      scene.add(mesh);

      const glb = await exportGLB(scene, { binary: true });
      expect(glb).toBeInstanceOf(ArrayBuffer);
      expect(glb.byteLength).toBeGreaterThan(0);

      // Check GLB magic number 0x46546C67 ('glTF')
      const view = new DataView(glb);
      const magic = view.getUint32(0, false);
      expect(magic).toBe(0x676c5446); // 'glTF' in big-endian
    });
  });
});
