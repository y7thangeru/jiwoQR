import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import {
  SpherifiedModuleTransform,
  computeGlobeModuleTransform,
  interpolateGlobeMorph,
  easeInOutCubic,
} from '@jiwoqr/math';

export interface GlobeModelInstance {
  group: THREE.Group;
  update(morphProgress: number, time?: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_BLACK = new THREE.Color(0x000000);
const COLOR_WHITE = new THREE.Color(0xffffff);

interface GlobeModuleMetadata {
  transform: SpherifiedModuleTransform;
  color3D: THREE.Color;
  isFinder: boolean;
}

export function createGlobeModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number; maxHeight?: number } = {}
): GlobeModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoGlobeModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;
  const maxHeight = options.maxHeight ?? totalWorldSize * 0.46;

  // 1. Collect all dark modules (continental landmasses + finder landmarks)
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
  // Total instances = Top hemisphere dome A + Bottom cloned dome B joined at equator Z = 0
  const totalInstances = count * 2;

  // 2. Equatorial Substrate Plate (Hidden in 3D mode, fades in to solid white in scan mode)
  const substrateGeometry = new THREE.PlaneGeometry(
    totalWorldSize + unit * 0.5,
    totalWorldSize + unit * 0.5
  );
  const substrateMaterial = new THREE.MeshStandardMaterial({
    color: COLOR_WHITE.clone(),
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0,
  });
  const substrateMesh = new THREE.Mesh(substrateGeometry, substrateMaterial);
  substrateMesh.name = 'GlobeEquatorialSubstrate';
  substrateMesh.position.set(0, 0, 0);
  substrateMesh.visible = false;
  group.add(substrateMesh);

  // 3. InstancedMesh for Modules (Top Mound A + Bottom Mound B)
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const moduleMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.5,
    flatShading: true,
  });

  const instancedMesh = new THREE.InstancedMesh(boxGeometry, moduleMaterial, totalInstances);
  instancedMesh.name = 'GlobeVoxelMesh';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  // DynamicDrawUsage for smooth 60 FPS morphing
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(totalInstances * 3),
    3
  );
  instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  group.add(instancedMesh);

  // 4. Precompute Transforms & Elevation Color Gradients
  const metadata: GlobeModuleMetadata[] = [];
  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const accentColor = new THREE.Color(dna.palette.accent);
  const rimColor = new THREE.Color(dna.palette.groundSubstrate);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);

  for (let i = 0; i < count; i++) {
    const { raw, isFinder } = darkModules[i];
    const transform = computeGlobeModuleTransform(
      raw.x,
      raw.y,
      totalGridSize,
      raw.isDark,
      isFinder,
      dna.seed32,
      {
        moduleSize,
        gap,
        maxHeight,
        finderElevationMultiplier: 1.25,
      }
    );

    // Color gradient based on dome elevation (matching reference Terrain mode)
    const heightRatio = Math.min(1.0, transform.scale3D.z / maxHeight);
    let color3D: THREE.Color;

    if (isFinder) {
      // Landmark towers have distinctive gold/cream/accent highlight
      color3D = finderColor.clone();
    } else if (heightRatio > 0.7) {
      // High altitude / peak: accent highlight
      color3D = primaryColor.clone().lerp(accentColor, (heightRatio - 0.7) / 0.3);
    } else if (heightRatio > 0.3) {
      // Mid altitude: primary to secondary purple/blue terrain
      color3D = secondaryColor.clone().lerp(primaryColor, (heightRatio - 0.3) / 0.4);
    } else {
      // Low altitude near equator rim: terracotta / deep substrate tone
      color3D = rimColor.clone().lerp(secondaryColor, heightRatio / 0.3);
    }

    metadata.push({ transform, color3D, isFinder });
  }

  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  function applyMorph(t: number) {
    const easedT = easeInOutCubic(t);
    const bottomScaleMultiplier = Math.max(0, 1.0 - easedT);

    for (let i = 0; i < count; i++) {
      const item = metadata[i];
      const { position, scale } = interpolateGlobeMorph(item.transform, t);

      // --- 1. Top Hemisphere Mound A ---
      // Extruded upwards from Z = 0 to +height
      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.set(scale.x, scale.y, scale.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Color transition to pure pitch black in scan mode
      tempColor.copy(item.color3D).lerp(COLOR_BLACK, easedT);
      instancedMesh.setColorAt(i, tempColor);

      // --- 2. Bottom Hemisphere Cloned Mound B (Flipped vertically) ---
      // In 3D (t = 0), extruded downwards from Z = 0 to -height, meeting A at equator.
      // In Scan Mode (t -> 1.0), collapses to scale 0 underneath the substrate plate.
      const bottomZ = -position.z * (1.0 - easedT) - 0.2 * easedT;
      dummy.position.set(position.x, position.y, bottomZ);
      dummy.scale.set(
        scale.x * bottomScaleMultiplier,
        scale.y * bottomScaleMultiplier,
        scale.z * bottomScaleMultiplier
      );
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(count + i, dummy.matrix);

      // Color for bottom clone
      instancedMesh.setColorAt(count + i, tempColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // Substrate plane is hidden in 3D mode (t = 0), and smoothly fades in to solid white as t -> 1.0
    substrateMaterial.opacity = easedT;
    substrateMesh.visible = easedT > 0.01;

    // Lighting & shadow mitigation in scan mode
    if (t > 0.85) {
      instancedMesh.castShadow = false;
      instancedMesh.receiveShadow = false;
      moduleMaterial.roughness = 1.0;
      moduleMaterial.metalness = 0.0;
    } else {
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      moduleMaterial.roughness = 0.4;
      moduleMaterial.metalness = 0.5;
    }
  }

  applyMorph(0);

  return {
    group,
    update(morphProgress: number) {
      applyMorph(morphProgress);
    },
    dispose() {
      substrateGeometry.dispose();
      substrateMaterial.dispose();
      boxGeometry.dispose();
      moduleMaterial.dispose();
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
