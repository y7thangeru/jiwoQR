import { describe, it, expect } from 'vitest';
import {
  lerp,
  lerpVec3,
  easeInOutCubic,
  computeModuleHeight,
  computeExtrusionTransform,
  interpolateExtrusion,
  cubeToSphere,
  uvToSphere,
  computeGlobeModuleTransform,
  interpolateGlobeMorph,
} from '../src/index.js';

describe('@jiwoqr/math', () => {
  describe('Easing & Interpolation', () => {
    it('lerps numbers and vectors correctly', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      const v = lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0.5);
      expect(v).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('bounds easeInOutCubic between 0 and 1', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });
  });

  describe('Extrusion Projection', () => {
    it('computes deterministic module heights', () => {
      const h1 = computeModuleHeight(5, 5, 12345, 0.5, 4.0, 0.8);
      const h2 = computeModuleHeight(5, 5, 12345, 0.5, 4.0, 0.8);
      const h3 = computeModuleHeight(6, 5, 12345, 0.5, 4.0, 0.8);

      expect(h1).toBe(h2);
      expect(h1).toBeGreaterThanOrEqual(0.5);
      expect(h1).toBeLessThanOrEqual(4.0);
      expect(h1).not.toBe(h3);
    });

    it('creates landmark towers for finder modules', () => {
      const finderTransform = computeExtrusionTransform(
        3,
        3,
        29,
        true,
        true, // isFinder
        12345,
        { maxHeight: 3.0, landmarkMultiplier: 1.5 }
      );

      const dataTransform = computeExtrusionTransform(
        10,
        10,
        29,
        true,
        false, // isFinder = false
        12345,
        { maxHeight: 3.0, landmarkMultiplier: 1.5 }
      );

      // Finder height in 3D should be landmarkMultiplier * maxHeight
      expect(finderTransform.scale3D.z).toBeCloseTo(4.5, 2);
      expect(finderTransform.scale3D.z).toBeGreaterThan(dataTransform.scale3D.z);

      // In 2D scan mode, both must collapse to flat thin modules
      expect(finderTransform.scale2D.z).toBeCloseTo(0.02, 2);
      expect(dataTransform.scale2D.z).toBeCloseTo(0.02, 2);
    });

    it('smoothly interpolates between 3D and 2D', () => {
      const transform = computeExtrusionTransform(3, 3, 29, true, true, 12345, {
        maxHeight: 3.0,
      });

      const at0 = interpolateExtrusion(transform, 0.0);
      expect(at0.scale.z).toBeCloseTo(transform.scale3D.z, 2);

      const at1 = interpolateExtrusion(transform, 1.0);
      expect(at1.scale.z).toBeCloseTo(transform.scale2D.z, 2);

      const atHalf = interpolateExtrusion(transform, 0.5);
      expect(atHalf.scale.z).toBeLessThan(at0.scale.z);
      expect(atHalf.scale.z).toBeGreaterThan(at1.scale.z);
    });
  });

  describe('Spherical Projections', () => {
    it('projects cube to unit sphere with valid normal', () => {
      const res = cubeToSphere({ x: 1, y: 1, z: 1 }, 2.0);
      const len = Math.hypot(res.position.x, res.position.y, res.position.z);
      expect(len).toBeCloseTo(2.0, 4);

      const normalLen = Math.hypot(res.normal.x, res.normal.y, res.normal.z);
      expect(normalLen).toBeCloseTo(1.0, 4);
    });

    it('projects uv to sphere coordinates', () => {
      const res = uvToSphere(0.5, 0.5, 5.0);
      const len = Math.hypot(res.position.x, res.position.y, res.position.z);
      expect(len).toBeCloseTo(5.0, 4);
    });

    it('computes globe dome mound heights with radial falloff', () => {
      const centerGlobe = computeGlobeModuleTransform(14, 14, 29, true, false, 999, {
        maxHeight: 12.0,
      });

      const edgeGlobe = computeGlobeModuleTransform(1, 1, 29, true, false, 999, {
        maxHeight: 12.0,
      });

      // Center module at peak of dome should be much higher than edge module near equator
      expect(centerGlobe.scale3D.z).toBeGreaterThan(edgeGlobe.scale3D.z);
      expect(centerGlobe.position3D.z).toBeGreaterThan(edgeGlobe.position3D.z);
    });

    it('smoothly flattens globe dome mound to flat 2D plane', () => {
      const globeTransform = computeGlobeModuleTransform(14, 14, 29, true, true, 999);
      const at0 = interpolateGlobeMorph(globeTransform, 0.0);
      const at1 = interpolateGlobeMorph(globeTransform, 1.0);

      // At t = 0, scale.z is full 3D mound height
      expect(at0.scale.z).toBeCloseTo(globeTransform.scale3D.z, 2);

      // At t = 1, scale.z collapses to 0.02 (flat 2D module)
      expect(at1.scale.z).toBeCloseTo(0.02, 2);
      expect(at1.position.z).toBeCloseTo(0.01, 2);
    });
  });
});

