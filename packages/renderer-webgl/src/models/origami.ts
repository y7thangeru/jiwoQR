import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import { computeOrigamiModuleTransform, easeInOutCubic } from '@jiwoqr/math';
import { attachGPUMorphShader, setupGPUMorphAttributes } from '../shaders/gpu-morph.js';

export interface OrigamiModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_WHITE = new THREE.Color(0xffffff);

/**
 * Creates a low-poly origami faceted paper prism geometry with 8 distinct triangular folds.
 * Crisp paper creases catch directional lighting dynamically under flat shading.
 */
function createOrigamiPrismGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();

  // 8 triangular facets for low-poly folded paper mountain/valley polyhedron
  // Base corners at z = 0, midpoints at z = 0.25, center apex at z = 1.0
  const c0 = [-0.48, -0.48, 0.0];
  const c1 = [0.48, -0.48, 0.0];
  const c2 = [0.48, 0.48, 0.0];
  const c3 = [-0.48, 0.48, 0.0];

  const m0 = [0.0, -0.48, 0.25];
  const m1 = [0.48, 0.0, 0.25];
  const m2 = [0.0, 0.48, 0.25];
  const m3 = [-0.48, 0.0, 0.25];

  const apex = [0.0, 0.0, 1.0];

  const vertices: number[] = [
    // South-West fold pair
    ...c0, ...m0, ...apex,
    ...c0, ...apex, ...m3,

    // South-East fold pair
    ...m0, ...c1, ...apex,
    ...c1, ...m1, ...apex,

    // North-East fold pair
    ...m1, ...c2, ...apex,
    ...c2, ...m2, ...apex,

    // North-West fold pair
    ...m2, ...c3, ...apex,
    ...c3, ...m3, ...apex,

    // Base bottom quad (2 triangles)
    ...c0, ...c2, ...c1,
    ...c0, ...c3, ...c2,
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates an Origami Crane / Layered Crown geometry for Finder Patterns.
 * Features flared geometric wings and an elevated central paper peak.
 */
function createOrigamiCraneGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();

  // Low-poly origami crane crown: flared geometric wings and tall central paper spire
  const base0 = [-0.48, -0.48, 0.0];
  const base1 = [0.48, -0.48, 0.0];
  const base2 = [0.48, 0.48, 0.0];
  const base3 = [-0.48, 0.48, 0.0];

  // Wing points flared outward
  const wingS = [0.0, -0.55, 0.45];
  const wingE = [0.55, 0.0, 0.45];
  const wingN = [0.0, 0.55, 0.45];
  const wingW = [-0.55, 0.0, 0.45];

  // Elevated crane crown peak
  const craneApex = [0.0, 0.0, 1.0];
  const midApex = [0.0, 0.0, 0.5];

  const vertices: number[] = [
    // Flared wings
    ...base0, ...wingS, ...midApex,
    ...wingS, ...base1, ...midApex,
    ...base1, ...wingE, ...midApex,
    ...wingE, ...base2, ...midApex,
    ...base2, ...wingN, ...midApex,
    ...wingN, ...base3, ...midApex,
    ...base3, ...wingW, ...midApex,
    ...wingW, ...base0, ...midApex,

    // Central crane spire / crown facets
    ...wingS, ...wingE, ...craneApex,
    ...wingE, ...wingN, ...craneApex,
    ...wingN, ...wingW, ...craneApex,
    ...wingW, ...wingS, ...craneApex,

    // Base bottom quad
    ...base0, ...base2, ...base1,
    ...base0, ...base3, ...base2,
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates the 6th Visual Archetype: Origami Fold (Geometric Folded Paper / Low-Poly Polyhedron).
 * Implements flat-shaded washi paper textures and GPU vertex shader mechanical unfolding.
 */
export function createOrigamiModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number } = {}
): OrigamiModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoOrigamiModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;

  // 1. Collect dark modules
  const darkModules: { raw: QRModule; isFinder: boolean }[] = [];

  for (let y = 0; y < totalGridSize; y++) {
    for (let x = 0; x < totalGridSize; x++) {
      const mod = matrix.grid[y][x];
      if (mod.isDark) {
        const isFinder = mod.type === 'FINDER';
        darkModules.push({ raw: mod, isFinder });
      }
    }
  }

  const count = darkModules.length;

  // 2. Substrate Paper Sheet
  const substrateGeometry = new THREE.PlaneGeometry(
    totalWorldSize + unit * 0.5,
    totalWorldSize + unit * 0.5
  );
  const substrate3DColor = new THREE.Color(dna.palette.groundSubstrate);
  const substrateMaterial = new THREE.MeshStandardMaterial({
    color: substrate3DColor.clone(),
    roughness: 0.95,
    metalness: 0.02,
  });

  const substrateMesh = new THREE.Mesh(substrateGeometry, substrateMaterial);
  substrateMesh.name = 'OrigamiPaperSubstrate';
  substrateMesh.position.set(0, 0, 0);
  group.add(substrateMesh);

  // 3. Geometries and Instanced Mesh
  const prismGeometry = createOrigamiPrismGeometry();
  const craneGeometry = createOrigamiCraneGeometry();

  // Washi / Parchment paper material with sharp flat shading
  const paperMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0.92,
    metalness: 0.05,
    clearcoat: 0.15,
    flatShading: true,
  });

  const morphUniforms = attachGPUMorphShader(paperMaterial, 0);

  // Split into standard paper prisms and finder cranes
  const standardModules: { raw: QRModule; index: number }[] = [];
  const finderModules: { raw: QRModule; index: number }[] = [];

  for (let i = 0; i < count; i++) {
    if (darkModules[i].isFinder) {
      finderModules.push({ raw: darkModules[i].raw, index: i });
    } else {
      standardModules.push({ raw: darkModules[i].raw, index: i });
    }
  }

  // Standard Paper Modules Mesh
  const standardMesh = new THREE.InstancedMesh(
    prismGeometry,
    paperMaterial,
    standardModules.length
  );
  standardMesh.name = 'OrigamiPaperPrismsMesh';
  standardMesh.castShadow = true;
  standardMesh.receiveShadow = true;

  // Finder Patterns Crane Mesh
  const craneMaterial = paperMaterial.clone();
  const craneUniforms = attachGPUMorphShader(craneMaterial, 0);
  const craneMesh = new THREE.InstancedMesh(
    craneGeometry,
    craneMaterial,
    finderModules.length
  );
  craneMesh.name = 'OrigamiCraneFindersMesh';
  craneMesh.castShadow = true;
  craneMesh.receiveShadow = true;

  // 4. Setup Buffer Attributes for Standard Mesh
  {
    const sCount = standardModules.length;
    const positions3D = new Float32Array(sCount * 3);
    const positions2D = new Float32Array(sCount * 3);
    const scales3D = new Float32Array(sCount * 3);
    const scales2D = new Float32Array(sCount * 3);
    const rotationsZ3D = new Float32Array(sCount);
    const colors3D = new Float32Array(sCount * 3);
    const colors2D = new Float32Array(sCount * 3);

    const primaryColor = new THREE.Color(dna.palette.primary);
    const secondaryColor = new THREE.Color(dna.palette.secondary);
    const accentColor = new THREE.Color(dna.palette.accent);
    const tempColor = new THREE.Color();

    for (let i = 0; i < sCount; i++) {
      const { raw } = standardModules[i];
      const transform = computeOrigamiModuleTransform(
        raw.x,
        raw.y,
        totalGridSize,
        true,
        false,
        dna.seed32
      );

      positions3D[i * 3] = transform.position3D.x;
      positions3D[i * 3 + 1] = transform.position3D.y;
      positions3D[i * 3 + 2] = transform.position3D.z;

      positions2D[i * 3] = transform.position2D.x;
      positions2D[i * 3 + 1] = transform.position2D.y;
      positions2D[i * 3 + 2] = transform.position2D.z;

      scales3D[i * 3] = transform.scale3D.x;
      scales3D[i * 3 + 1] = transform.scale3D.y;
      scales3D[i * 3 + 2] = transform.scale3D.z;

      scales2D[i * 3] = transform.scale2D.x;
      scales2D[i * 3 + 1] = transform.scale2D.y;
      scales2D[i * 3 + 2] = transform.scale2D.z;

      rotationsZ3D[i] = transform.rotationZ;

      // Origami folded paper tinting: alternating facets of primary/secondary/accent
      const colorHash = (raw.x * 17 + raw.y * 31 + dna.seed32) % 10;
      if (colorHash < 5) {
        tempColor.copy(primaryColor);
      } else if (colorHash < 8) {
        tempColor.copy(secondaryColor);
      } else {
        tempColor.copy(accentColor);
      }

      colors3D[i * 3] = tempColor.r;
      colors3D[i * 3 + 1] = tempColor.g;
      colors3D[i * 3 + 2] = tempColor.b;

      // 2D Scan Mode color: Pure black for maximum scan contrast
      colors2D[i * 3] = 0.0;
      colors2D[i * 3 + 1] = 0.0;
      colors2D[i * 3 + 2] = 0.0;
    }

    setupGPUMorphAttributes(
      prismGeometry,
      {
        count: sCount,
        positions3D,
        positions2D,
        scales3D,
        scales2D,
        rotationsZ3D,
        colors3D,
        colors2D,
      },
      standardMesh
    );
    group.add(standardMesh);
  }

  // 5. Setup Buffer Attributes for Crane Mesh
  {
    const fCount = finderModules.length;
    const positions3D = new Float32Array(fCount * 3);
    const positions2D = new Float32Array(fCount * 3);
    const scales3D = new Float32Array(fCount * 3);
    const scales2D = new Float32Array(fCount * 3);
    const rotationsZ3D = new Float32Array(fCount);
    const colors3D = new Float32Array(fCount * 3);
    const colors2D = new Float32Array(fCount * 3);

    const finderColor = new THREE.Color(dna.palette.finderEmissive);

    for (let i = 0; i < fCount; i++) {
      const { raw } = finderModules[i];
      const transform = computeOrigamiModuleTransform(
        raw.x,
        raw.y,
        totalGridSize,
        true,
        true,
        dna.seed32
      );

      positions3D[i * 3] = transform.position3D.x;
      positions3D[i * 3 + 1] = transform.position3D.y;
      positions3D[i * 3 + 2] = transform.position3D.z;

      positions2D[i * 3] = transform.position2D.x;
      positions2D[i * 3 + 1] = transform.position2D.y;
      positions2D[i * 3 + 2] = transform.position2D.z;

      scales3D[i * 3] = transform.scale3D.x;
      scales3D[i * 3 + 1] = transform.scale3D.y;
      scales3D[i * 3 + 2] = transform.scale3D.z;

      scales2D[i * 3] = transform.scale2D.x;
      scales2D[i * 3 + 1] = transform.scale2D.y;
      scales2D[i * 3 + 2] = transform.scale2D.z;

      rotationsZ3D[i] = transform.rotationZ;

      colors3D[i * 3] = finderColor.r;
      colors3D[i * 3 + 1] = finderColor.g;
      colors3D[i * 3 + 2] = finderColor.b;

      // Pure black in 2D scan mode
      colors2D[i * 3] = 0.0;
      colors2D[i * 3 + 1] = 0.0;
      colors2D[i * 3 + 2] = 0.0;
    }

    setupGPUMorphAttributes(
      craneGeometry,
      {
        count: fCount,
        positions3D,
        positions2D,
        scales3D,
        scales2D,
        rotationsZ3D,
        colors3D,
        colors2D,
      },
      craneMesh
    );
    group.add(craneMesh);
  }

  // 6. Return instance with buttery smooth GPU morph updates
  return {
    group,
    update(morphProgress: number) {
      morphUniforms.uMorphProgress.value = morphProgress;
      craneUniforms.uMorphProgress.value = morphProgress;

      // Morph substrate paper sheet color from 3D tone to pure white scan background
      const t = easeInOutCubic(Math.max(0, Math.min(1, morphProgress)));
      substrateMaterial.color.lerpColors(substrate3DColor, COLOR_WHITE, t);
    },
    dispose() {
      prismGeometry.dispose();
      craneGeometry.dispose();
      substrateGeometry.dispose();
      paperMaterial.dispose();
      craneMaterial.dispose();
      substrateMaterial.dispose();
    },
    getQRWorldBounds() {
      return {
        width: totalWorldSize,
        height: totalWorldSize,
      };
    },
  };
}
