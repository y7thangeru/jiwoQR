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
  computeCircuitModuleTransform,
  interpolateCircuitMorph,
  computeBiomorphicModuleTransform,
  interpolateBiomorphicMorph,
  computeStreetFacingAngle,
  computeCityModuleTransform,
  interpolateCityTransform,
  computeOrigamiModuleTransform,
  calculateOrigamiUnfold,
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

  describe('Circuit Projections', () => {
    it('generates CHIP_IC for finder patterns and SMD components for data modules', () => {
      const finder = computeCircuitModuleTransform(3, 3, 29, true, true, 100);
      expect(finder.componentType).toBe('CHIP_IC');
      expect(finder.scale3D.z).toBeGreaterThan(0.5);

      const dataResistor = computeCircuitModuleTransform(10, 10, 29, true, false, 100);
      expect(['RESISTOR', 'CAPACITOR', 'VIA_PAD', 'TRACE_H', 'TRACE_V']).toContain(
        dataResistor.componentType
      );
    });

    it('smoothly melts circuit components into flat 2D modules in scan mode', () => {
      const circuit = computeCircuitModuleTransform(5, 5, 29, true, false, 42);
      const at0 = interpolateCircuitMorph(circuit, 0.0);
      const at1 = interpolateCircuitMorph(circuit, 1.0);

      expect(at0.scale.z).toBeCloseTo(circuit.scale3D.z, 2);
      expect(at1.scale.z).toBeCloseTo(0.02, 2);
      expect(at1.rotationZ).toBeCloseTo(0, 2);
    });
  });

  describe('Biomorphic Projections', () => {
    it('generates crystalline heights and monolithic finder towers', () => {
      const finder = computeBiomorphicModuleTransform(3, 3, 29, true, true, 888, {
        maxHeight: 4.0,
        finderMultiplier: 2.0,
      });

      const dataCrystal = computeBiomorphicModuleTransform(12, 12, 29, true, false, 888, {
        maxHeight: 4.0,
        finderMultiplier: 2.0,
      });

      expect(finder.crystalStyle).toBe('geode_cluster');
      expect(finder.scale3D.z).toBeCloseTo(8.0, 2);
      expect(finder.scale3D.z).toBeGreaterThan(dataCrystal.scale3D.z);
      expect(dataCrystal.scale3D.z).toBeGreaterThanOrEqual(0.4);
      expect(dataCrystal.scale3D.z).toBeLessThanOrEqual(4.0);
    });

    it('assigns natural facet rotations and tilts to data crystals', () => {
      const crystal = computeBiomorphicModuleTransform(7, 9, 29, true, false, 555);
      expect(typeof crystal.rotationZ).toBe('number');
      expect(typeof crystal.tiltAngle).toBe('number');
      expect([
        'hexagonal',
        'needle_prism',
        'geode_cluster',
        'coral_branch',
      ]).toContain(crystal.crystalStyle);
    });

    it('smoothly flattens 3D mineral crystals to canonical 2D modules in scan mode', () => {
      const crystal = computeBiomorphicModuleTransform(10, 10, 29, true, false, 777);
      const at0 = interpolateBiomorphicMorph(crystal, 0.0);
      const at1 = interpolateBiomorphicMorph(crystal, 1.0);

      expect(at0.scale.z).toBeCloseTo(crystal.scale3D.z, 2);
      expect(at0.rotationZ).toBeCloseTo(crystal.rotationZ, 2);

      // In scan mode (t = 1.0), rotation and tilt reset to 0 and scale becomes flat
      expect(at1.scale.z).toBeCloseTo(0.02, 2);
      expect(at1.position.z).toBeCloseTo(0.01, 2);
      expect(at1.rotationZ).toBeCloseTo(0, 2);
      expect(at1.tiltAngle).toBeCloseTo(0, 2);
    });
  });

  describe('City Metropolis Projections (Model 5)', () => {
    it('computes street-facing orientation toward open orthogonal light modules', () => {
      // Mock grid where North neighbor (y-1) is open road (false) and others are buildings (true)
      const isDarkSampler = (x: number, y: number) => {
        if (x === 5 && y === 4) return false; // North is open
        return true;
      };

      const angle = computeStreetFacingAngle(5, 5, 29, isDarkSampler, 123);
      expect(angle).toBeCloseTo(Math.PI / 2, 2); // Facing North (+Y)
    });

    it('assigns landmark tiers to finders and CBD high-rises to center modules', () => {
      const finder = computeCityModuleTransform(3, 3, 29, true, true, 42, 8);
      expect(finder.tier).toBe('LANDMARK_TOWER');
      expect(finder.scale3D.z).toBeGreaterThan(6.0);

      const cbdCenter = computeCityModuleTransform(14, 14, 29, true, false, 42, 8);
      expect(cbdCenter.tier).toBe('HIGH_RISE');

      const edgeBlock = computeCityModuleTransform(27, 27, 29, true, false, 42, 8);
      expect(edgeBlock.tier).toBe('URBAN_BLOCK');
      expect(cbdCenter.scale3D.z).toBeGreaterThan(edgeBlock.scale3D.z);
    });

    it('smoothly flattens city buildings into canonical 2D scan modules', () => {
      const cityModule = computeCityModuleTransform(10, 10, 29, true, false, 42, 8);
      const at0 = interpolateCityTransform(cityModule, 0.0);
      const at1 = interpolateCityTransform(cityModule, 1.0);

      expect(at0.scale.z).toBeCloseTo(cityModule.scale3D.z, 2);
      expect(at1.scale.z).toBeCloseTo(0.02, 2);
      expect(at1.position.z).toBeCloseTo(0.01, 2);
      expect(at1.rotationZ).toBeCloseTo(0, 2);
    });
  });

  describe('Origami Fold Projections (Model 6)', () => {
    it('computes low-poly folded paper polyhedron transforms with mountain and valley creases', () => {
      const module = computeOrigamiModuleTransform(12, 12, 29, true, false, 999);
      expect(module.isDark).toBe(true);
      expect(module.isFinder).toBe(false);
      expect(['mountain', 'diagonal_pyramid', 'valley']).toContain(module.foldStyle);
      expect(module.scale3D.z).toBeGreaterThan(0.5);
      expect(module.foldAngle).toBeGreaterThan(0);
      expect(module.creaseSharpness).toBeGreaterThanOrEqual(0.65);
    });

    it('assigns elevated crane crown structures to finder patterns', () => {
      const finder = computeOrigamiModuleTransform(3, 3, 29, true, true, 999);
      expect(finder.isFinder).toBe(true);
      expect(finder.foldStyle).toBe('crane_wing');
      expect(finder.scale3D.z).toBeGreaterThan(5.0);
      expect(finder.creaseSharpness).toBeCloseTo(0.95, 2);
    });

    it('mechanically unfolds 3D paper facets into solid canonical 2D modules', () => {
      const module = computeOrigamiModuleTransform(10, 10, 29, true, false, 999);
      const at0 = calculateOrigamiUnfold(module, 0.0);
      const atHalf = calculateOrigamiUnfold(module, 0.5);
      const at1 = calculateOrigamiUnfold(module, 1.0);

      // At t = 0: full 3D fold
      expect(at0.scale.z).toBeCloseTo(module.scale3D.z, 2);
      expect(at0.foldAngle).toBeCloseTo(module.foldAngle, 2);

      // Intermediate t = 0.5: unfolding in progress
      expect(atHalf.scale.z).toBeLessThan(at0.scale.z);
      expect(atHalf.scale.z).toBeGreaterThan(at1.scale.z);

      // At t = 1.0: flattened canonical 2D scan mode
      expect(at1.scale.z).toBeCloseTo(0.01, 2);
      expect(at1.foldAngle).toBeCloseTo(0, 2);
      expect(at1.rotationZ).toBeCloseTo(0, 2);
    });
  });
});




