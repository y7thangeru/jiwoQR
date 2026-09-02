import * as THREE from 'three';
import { QRMatrix, DeterministicDNA } from '@jiwoqr/core';
import {
  CityModuleTransform,
  computeCityModuleTransform,
  easeInOutCubic,
} from '@jiwoqr/math';
import { BuildingModelManager } from './building-manager.js';
import {
  attachGPUMorphShader,
  setupGPUMorphAttributes,
} from '../shaders/gpu-morph.js';

export interface CityModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_WHITE = new THREE.Color(0xffffff);

interface ModuleCityMetadata {
  transform: CityModuleTransform;
  color3D: THREE.Color;
  isFinder: boolean;
  modelIndex: number;
}

export function createCityModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number; buildingGeometries?: THREE.BufferGeometry[] } = {}
): CityModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoCityMetropolisModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.05;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;

  // 1. Retrieve Building Geometries (From option or BuildingModelManager)
  let geometries = options.buildingGeometries;
  if (!geometries || geometries.length === 0) {
    geometries = BuildingModelManager.getInstance().getGeometries();
  }
  const modelCount = geometries.length;

  // 2. Classify Dark Modules & Group by Building Model Bucket
  const darkSampler = (x: number, y: number): boolean => {
    if (x < 0 || x >= totalGridSize || y < 0 || y >= totalGridSize) return false;
    return matrix.grid[y][x]?.isDark ?? false;
  };

  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const accentColor = new THREE.Color(dna.palette.accent);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);

  const buckets: ModuleCityMetadata[][] = Array.from({ length: modelCount }, () => []);

  for (let y = 0; y < totalGridSize; y++) {
    for (let x = 0; x < totalGridSize; x++) {
      const mod = matrix.grid[y][x];
      if (!mod.isDark) continue;

      const isFinder = mod.type === 'FINDER';
      const transform = computeCityModuleTransform(
        x,
        y,
        totalGridSize,
        true,
        isFinder,
        dna.seed32,
        modelCount,
        darkSampler,
        {
          moduleSize,
          gap,
          maxHeight: dna.architecture.maxHeight * 1.3,
          landmarkMultiplier: 2.2,
          buildingScale: dna.city?.buildingScale ?? 1.0,
        }
      );

      let color3D: THREE.Color;
      if (isFinder) {
        color3D = finderColor.clone();
      } else if (transform.tier === 'HIGH_RISE') {
        const blend = ((x * 17 + y * 31 + dna.seed32) % 100) / 100;
        color3D = primaryColor.clone().lerp(accentColor, blend * 0.4);
      } else if (transform.tier === 'MID_RISE') {
        const blend = ((x * 13 + y * 37 + dna.seed32) % 100) / 100;
        color3D = primaryColor.clone().lerp(secondaryColor, blend * 0.5);
      } else {
        const blend = ((x * 19 + y * 23 + dna.seed32) % 100) / 100;
        color3D = secondaryColor.clone().lerp(primaryColor, blend * 0.35);
      }

      const assignedModel = Math.min(modelCount - 1, Math.max(0, transform.modelIndex));
      buckets[assignedModel].push({
        transform,
        color3D,
        isFinder,
        modelIndex: assignedModel,
      });
    }
  }

  // 3. Ground Substrate Plate (Avenue & Pavement Grid with Quiet Zone)
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
  substrateMesh.name = 'CityGroundSubstrate';
  substrateMesh.position.set(0, 0, 0);
  group.add(substrateMesh);

  // 4. GPU Morph Shader Material & Instanced Meshes
  const buildingMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.55,
    flatShading: false,
  });
  const morphUniforms = attachGPUMorphShader(buildingMaterial);

  const instancedMeshes: THREE.InstancedMesh[] = [];
  const clonedGeometries: THREE.BufferGeometry[] = [];

  for (let m = 0; m < modelCount; m++) {
    const items = buckets[m];
    if (items.length === 0) continue;

    const count = items.length;
    const geom = geometries[m].clone();
    clonedGeometries.push(geom);

    const positions3D = new Float32Array(count * 3);
    const positions2D = new Float32Array(count * 3);
    const scales3D = new Float32Array(count * 3);
    const scales2D = new Float32Array(count * 3);
    const rotationsZ3D = new Float32Array(count);
    const colors3D = new Float32Array(count * 3);
    const colors2D = new Float32Array(count * 3); // Pure black (0, 0, 0) for scan mode

    for (let i = 0; i < count; i++) {
      const item = items[i];
      const i3 = i * 3;

      positions3D[i3] = item.transform.position3D.x;
      positions3D[i3 + 1] = item.transform.position3D.y;
      positions3D[i3 + 2] = item.transform.position3D.z;

      positions2D[i3] = item.transform.position2D.x;
      positions2D[i3 + 1] = item.transform.position2D.y;
      positions2D[i3 + 2] = item.transform.position2D.z;

      scales3D[i3] = item.transform.scale3D.x;
      scales3D[i3 + 1] = item.transform.scale3D.y;
      scales3D[i3 + 2] = item.transform.scale3D.z;

      scales2D[i3] = item.transform.scale2D.x;
      scales2D[i3 + 1] = item.transform.scale2D.y;
      scales2D[i3 + 2] = item.transform.scale2D.z;

      rotationsZ3D[i] = item.transform.rotationZ;

      colors3D[i3] = item.color3D.r;
      colors3D[i3 + 1] = item.color3D.g;
      colors3D[i3 + 2] = item.color3D.b;
    }

    const instMesh = new THREE.InstancedMesh(geom, buildingMaterial, count);
    instMesh.name = `CityBuildings_Model_${m}`;
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    setupGPUMorphAttributes(
      geom,
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
      instMesh
    );

    group.add(instMesh);
    instancedMeshes.push(instMesh);
  }

  return {
    group,
    update(morphProgress: number) {
      // High-performance GPU uniform update (~0.001ms CPU time)
      morphUniforms.uMorphProgress.value = morphProgress;

      const easedT = easeInOutCubic(morphProgress);
      substrateMaterial.color.copy(substrate3DColor).lerp(COLOR_WHITE, easedT);

      // Scan mode lighting & shadow mitigation
      if (morphProgress > 0.85) {
        buildingMaterial.roughness = 1.0;
        buildingMaterial.metalness = 0.0;
        for (const mesh of instancedMeshes) {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        }
      } else {
        buildingMaterial.roughness = 0.35;
        buildingMaterial.metalness = 0.55;
        for (const mesh of instancedMeshes) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      }
    },
    dispose() {
      substrateGeometry.dispose();
      substrateMaterial.dispose();
      buildingMaterial.dispose();
      for (const geom of clonedGeometries) {
        geom.dispose();
      }
      for (const mesh of instancedMeshes) {
        mesh.dispose();
      }
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
