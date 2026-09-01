import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import {
  ExtrusionModuleTransform,
  computeExtrusionTransform,
  interpolateExtrusion,
  easeInOutCubic,
} from '@jiwoqr/math';

export interface ArchitectureModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_BLACK = new THREE.Color(0x000000);
const COLOR_WHITE = new THREE.Color(0xffffff);

interface ModuleMetadata {
  transform: ExtrusionModuleTransform;
  color3D: THREE.Color;
  isFinder: boolean;
}

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
  // 1x1x1 unit box geometry with center at (0, 0, 0)
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

  // Standard PBR Material for 3D Cyber-Brutalist look
  const buildingMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.65,
    flatShading: true,
  });

  const instancedMesh = new THREE.InstancedMesh(boxGeometry, buildingMaterial, count);
  instancedMesh.name = 'CityBlocksInstancedMesh';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  // User Note 4: DynamicDrawUsage for smooth 60 FPS morphing buffers
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  // 3. Ground Substrate Plate (covers QR matrix + Quiet Zone)
  // User Note 2: Minimum 4 modules Quiet Zone is included in totalWorldSize.
  // In 3D mode: Cyberpunk/dark substrate plate. In Scan Mode: interpolates to crisp solid white.
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
  substrateMesh.position.set(0, 0, 0); // Flat on XY plane, facing +Z
  group.add(substrateMesh);

  // 4. Precompute Transforms & Color Mapping for Each Module
  const metadata: ModuleMetadata[] = [];
  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);

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
        landmarkMultiplier: 1.75, // Finder patterns tower higher as landmarks
      }
    );

    let color3D: THREE.Color;
    if (isFinder) {
      // Landmark towers have distinct emissive accent color
      color3D = finderColor.clone();
    } else {
      // Deterministic palette variation for city buildings
      const blend = ((raw.x * 13 + raw.y * 37 + dna.seed32) % 100) / 100;
      color3D = primaryColor.clone().lerp(secondaryColor, blend * 0.45);
    }

    metadata.push({ transform, color3D, isFinder });
  }

  // Helper objects for matrix calculation
  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // Initial update at t = 0 (3D mode)
  function applyMorph(t: number) {
    const easedT = easeInOutCubic(t);

    for (let i = 0; i < count; i++) {
      const item = metadata[i];
      const { position, scale } = interpolateExtrusion(item.transform, t);

      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.set(scale.x, scale.y, scale.z);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Interpolate color from 3D cyber palette to pure pitch black in scan mode (t -> 1.0)
      tempColor.copy(item.color3D).lerp(COLOR_BLACK, easedT);
      instancedMesh.setColorAt(i, tempColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // User Note 2: Substrate plate color interpolates to pure solid white in scan mode
    substrateMaterial.color.copy(substrate3DColor).lerp(COLOR_WHITE, easedT);

    // User Note 3: Lighting & shadow mitigation in scan mode
    if (t > 0.85) {
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
  }

  applyMorph(0);
  group.add(instancedMesh);

  return {
    group,
    update(morphProgress: number) {
      applyMorph(morphProgress);
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
