import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import { computeExtrusionTransform, easeInOutCubic } from '@jiwoqr/math';
import { attachGPUMorphShader, setupGPUMorphAttributes } from '../shaders/gpu-morph.js';

export interface ArchitectureModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_WHITE = new THREE.Color(0xffffff);

export function createArchitectureModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number } = {}
): ArchitectureModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoArchitectureModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;

  // 1. Collect all dark modules that will form buildings and towers
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

  // 2. Geometry and Material for Instanced Skyscraper City
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

  const buildingMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.65,
    flatShading: true,
  });

  // Attach GPU Vertex Shader morphing logic
  const morphUniforms = attachGPUMorphShader(buildingMaterial, 0);

  const instancedMesh = new THREE.InstancedMesh(boxGeometry, buildingMaterial, count);
  instancedMesh.name = 'CityBlocksInstancedMesh';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  // 3. Ground Substrate Plate (covers QR matrix + Quiet Zone)
  const substrateGeometry = new THREE.PlaneGeometry(
    totalWorldSize + unit * 0.5,
    totalWorldSize + unit * 0.5
  );
  const substrate3DColor = new THREE.Color(dna.palette.groundSubstrate);
  const substrateMaterial = new THREE.MeshStandardMaterial({
    color: substrate3DColor.clone(),
    roughness: 0.8,
    metalness: 0.1,
  });

  const substrateMesh = new THREE.Mesh(substrateGeometry, substrateMaterial);
  substrateMesh.name = 'GroundSubstrate';
  substrateMesh.position.set(0, 0, 0);
  group.add(substrateMesh);

  // 4. Precompute GPU Buffer Attributes (Static one-time upload to GPU VBOs)
  const positions3D = new Float32Array(count * 3);
  const positions2D = new Float32Array(count * 3);
  const scales3D = new Float32Array(count * 3);
  const scales2D = new Float32Array(count * 3);
  const colors3D = new Float32Array(count * 3);
  const colors2D = new Float32Array(count * 3); // defaults to 0,0,0 (pitch black)

  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);
  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const { raw, isFinder } = darkModules[i];
    const transform = computeExtrusionTransform(
      raw.x,
      raw.y,
      totalGridSize,
      raw.isDark,
      isFinder,
      dna.seed32,
      {
        moduleSize,
        gap,
        maxHeight: dna.architecture.maxHeight,
        heightVariance: dna.architecture.heightVariance,
        landmarkMultiplier: 1.75,
      }
    );

    const i3 = i * 3;
    // 3D position & scale
    positions3D[i3] = transform.position3D.x;
    positions3D[i3 + 1] = transform.position3D.y;
    positions3D[i3 + 2] = transform.position3D.z;

    scales3D[i3] = transform.scale3D.x;
    scales3D[i3 + 1] = transform.scale3D.y;
    scales3D[i3 + 2] = transform.scale3D.z;

    // 2D position & scale
    positions2D[i3] = transform.position2D.x;
    positions2D[i3 + 1] = transform.position2D.y;
    positions2D[i3 + 2] = transform.position2D.z;

    scales2D[i3] = transform.scale2D.x;
    scales2D[i3 + 1] = transform.scale2D.y;
    scales2D[i3 + 2] = transform.scale2D.z;

    // 3D Color
    if (isFinder) {
      colors3D[i3] = finderColor.r;
      colors3D[i3 + 1] = finderColor.g;
      colors3D[i3 + 2] = finderColor.b;
    } else {
      const blend = ((raw.x * 13 + raw.y * 37 + dna.seed32) % 100) / 100;
      tempColor.copy(primaryColor).lerp(secondaryColor, blend * 0.45);
      colors3D[i3] = tempColor.r;
      colors3D[i3 + 1] = tempColor.g;
      colors3D[i3 + 2] = tempColor.b;
    }

    // 2D Color is pitch black [0, 0, 0] (already 0 in Float32Array)
  }

  setupGPUMorphAttributes(
    boxGeometry,
    {
      count,
      positions3D,
      positions2D,
      scales3D,
      scales2D,
      colors3D,
      colors2D,
    },
    instancedMesh
  );

  group.add(instancedMesh);

  return {
    group,
    update(morphProgress: number) {
      // GPU uniform update (CPU cost: ~0.001ms)
      morphUniforms.uMorphProgress.value = morphProgress;

      const easedT = easeInOutCubic(morphProgress);
      substrateMaterial.color.copy(substrate3DColor).lerp(COLOR_WHITE, easedT);

      if (morphProgress > 0.85) {
        instancedMesh.castShadow = false;
        instancedMesh.receiveShadow = false;
        buildingMaterial.roughness = 1.0;
        buildingMaterial.metalness = 0.0;
      } else {
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        buildingMaterial.roughness = 0.35;
        buildingMaterial.metalness = 0.65;
      }
    },
    dispose() {
      boxGeometry.dispose();
      buildingMaterial.dispose();
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
