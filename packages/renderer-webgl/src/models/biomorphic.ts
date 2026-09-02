import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import { computeBiomorphicModuleTransform, easeInOutCubic } from '@jiwoqr/math';
import { attachGPUMorphShader, setupGPUMorphAttributes } from '../shaders/gpu-morph.js';

export interface BiomorphicModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_WHITE = new THREE.Color(0xffffff);

export function createBiomorphicModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number } = {}
): BiomorphicModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoBiomorphicModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;

  // 1. Collect all dark modules (Crystalline prisms & monolithic geode finder patterns)
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

  // 2. Substrate Bedrock Plate
  const substrateGeometry = new THREE.PlaneGeometry(
    totalWorldSize + unit * 0.5,
    totalWorldSize + unit * 0.5
  );
  const substrate3DColor = new THREE.Color(dna.palette.groundSubstrate);
  const substrateMaterial = new THREE.MeshStandardMaterial({
    color: substrate3DColor.clone(),
    roughness: 0.85,
    metalness: 0.15,
  });

  const substrateMesh = new THREE.Mesh(substrateGeometry, substrateMaterial);
  substrateMesh.name = 'MineralSubstrateBedrock';
  substrateMesh.position.set(0, 0, 0);
  group.add(substrateMesh);

  // 3. Hexagonal Crystal Column & Prism Geometry
  // Radius top: 0.46, Radius bottom: 0.54, Height: 1.0, 6 radial segments (hexagonal crystal)
  const crystalGeometry = new THREE.CylinderGeometry(0.46, 0.54, 1.0, 6);

  // Translucent / refractive crystal physical material
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0.18,
    metalness: 0.12,
    transmission: 0.35,
    ior: dna.biomorphic?.refractionIndex ?? 1.55,
    clearcoat: 0.75,
    flatShading: true,
  });

  const morphUniforms = attachGPUMorphShader(crystalMaterial, 0);

  const instancedMesh = new THREE.InstancedMesh(crystalGeometry, crystalMaterial, count);
  instancedMesh.name = 'BiomorphicCrystalClusterMesh';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  // 4. Precompute GPU Buffer Attributes
  const positions3D = new Float32Array(count * 3);
  const positions2D = new Float32Array(count * 3);
  const scales3D = new Float32Array(count * 3);
  const scales2D = new Float32Array(count * 3);
  const rotationsZ3D = new Float32Array(count);
  const colors3D = new Float32Array(count * 3);
  const colors2D = new Float32Array(count * 3);

  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const accentColor = new THREE.Color(dna.palette.accent);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);
  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const { raw, isFinder } = darkModules[i];
    const transform = computeBiomorphicModuleTransform(
      raw.x,
      raw.y,
      totalGridSize,
      raw.isDark,
      isFinder,
      dna.seed32,
      {
        moduleSize,
        gap,
        maxHeight: dna.architecture.maxHeight * 1.25,
        finderMultiplier: 1.9,
      }
    );

    const i3 = i * 3;
    positions3D[i3] = transform.position3D.x;
    positions3D[i3 + 1] = transform.position3D.y;
    positions3D[i3 + 2] = transform.position3D.z;

    scales3D[i3] = transform.scale3D.x;
    scales3D[i3 + 1] = transform.scale3D.y;
    scales3D[i3 + 2] = transform.scale3D.z;

    positions2D[i3] = transform.position2D.x;
    positions2D[i3 + 1] = transform.position2D.y;
    positions2D[i3 + 2] = transform.position2D.z;

    scales2D[i3] = transform.scale2D.x;
    scales2D[i3 + 1] = transform.scale2D.y;
    scales2D[i3 + 2] = transform.scale2D.z;

    rotationsZ3D[i] = transform.rotationZ;

    if (isFinder) {
      // Glowing monolithic geodesic geode crystal monument
      tempColor.copy(finderColor);
    } else {
      // Iridescent mineral hues (quartz, tourmaline, amethyst, opal)
      const blend = ((raw.x * 17 + raw.y * 31 + dna.seed32) % 100) / 100;
      if (blend > 0.6) {
        tempColor.copy(primaryColor).lerp(accentColor, (blend - 0.6) / 0.4);
      } else {
        tempColor.copy(secondaryColor).lerp(primaryColor, blend / 0.6);
      }
    }

    colors3D[i3] = tempColor.r;
    colors3D[i3 + 1] = tempColor.g;
    colors3D[i3 + 2] = tempColor.b;
  }

  setupGPUMorphAttributes(
    crystalGeometry,
    {
      count,
      positions3D,
      positions2D,
      scales3D,
      scales2D,
      rotationsZ3D,
      colors3D,
      colors2D,
    },
    instancedMesh
  );

  group.add(instancedMesh);

  return {
    group,
    update(morphProgress: number) {
      // GPU uniform update (CPU execution: ~0.001ms)
      morphUniforms.uMorphProgress.value = morphProgress;

      const easedT = easeInOutCubic(morphProgress);
      substrateMaterial.color.copy(substrate3DColor).lerp(COLOR_WHITE, easedT);

      // In scan mode (t -> 1.0), crystals solidify and flatten into canonical opaque black tiles
      if (morphProgress > 0.85) {
        instancedMesh.castShadow = false;
        instancedMesh.receiveShadow = false;
        crystalMaterial.transmission = 0.0;
        crystalMaterial.roughness = 1.0;
        crystalMaterial.metalness = 0.0;
        crystalMaterial.clearcoat = 0.0;
      } else {
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        crystalMaterial.transmission = 0.35 * (1.0 - easedT);
        crystalMaterial.roughness = 0.18 + easedT * 0.82;
        crystalMaterial.metalness = 0.12 * (1.0 - easedT);
        crystalMaterial.clearcoat = 0.75 * (1.0 - easedT);
      }
    },
    dispose() {
      crystalGeometry.dispose();
      crystalMaterial.dispose();
      substrateGeometry.dispose();
      substrateMaterial.dispose();
      group.clear();
    },
    getQRWorldBounds() {
      return {
        width: totalWorldSize,
        height: totalWorldSize,
      };
    },
  };
}
