import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import { computeGlobeModuleTransform, easeInOutCubic } from '@jiwoqr/math';
import { attachGPUMorphShader, setupGPUMorphAttributes } from '../shaders/gpu-morph.js';

export interface GlobeModelInstance {
  group: THREE.Group;
  update(morphProgress: number, time?: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_WHITE = new THREE.Color(0xffffff);

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

  const morphUniforms = attachGPUMorphShader(moduleMaterial, 0);

  const instancedMesh = new THREE.InstancedMesh(boxGeometry, moduleMaterial, totalInstances);
  instancedMesh.name = 'GlobeVoxelMesh';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  // 4. Precompute GPU Buffer Attributes for Mound A & Mound B
  const positions3D = new Float32Array(totalInstances * 3);
  const positions2D = new Float32Array(totalInstances * 3);
  const scales3D = new Float32Array(totalInstances * 3);
  const scales2D = new Float32Array(totalInstances * 3);
  const colors3D = new Float32Array(totalInstances * 3);
  const colors2D = new Float32Array(totalInstances * 3);

  const primaryColor = new THREE.Color(dna.palette.primary);
  const secondaryColor = new THREE.Color(dna.palette.secondary);
  const accentColor = new THREE.Color(dna.palette.accent);
  const rimColor = new THREE.Color(dna.palette.groundSubstrate);
  const finderColor = new THREE.Color(dna.palette.finderEmissive);
  const tempColor = new THREE.Color();

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

    // Color gradient based on dome elevation
    const heightRatio = Math.min(1.0, transform.scale3D.z / maxHeight);
    if (isFinder) {
      tempColor.copy(finderColor);
    } else if (heightRatio > 0.7) {
      tempColor.copy(primaryColor).lerp(accentColor, (heightRatio - 0.7) / 0.3);
    } else if (heightRatio > 0.3) {
      tempColor.copy(secondaryColor).lerp(primaryColor, (heightRatio - 0.3) / 0.4);
    } else {
      tempColor.copy(rimColor).lerp(secondaryColor, heightRatio / 0.3);
    }

    // --- 1. Top Hemisphere Mound A ---
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

    colors3D[i3] = tempColor.r;
    colors3D[i3 + 1] = tempColor.g;
    colors3D[i3 + 2] = tempColor.b;

    // --- 2. Bottom Hemisphere Mound B ---
    const b3 = (count + i) * 3;
    positions3D[b3] = transform.position3D.x;
    positions3D[b3 + 1] = transform.position3D.y;
    positions3D[b3 + 2] = -transform.position3D.z; // Mirrored downwards

    scales3D[b3] = transform.scale3D.x;
    scales3D[b3 + 1] = transform.scale3D.y;
    scales3D[b3 + 2] = transform.scale3D.z;

    positions2D[b3] = transform.position2D.x;
    positions2D[b3 + 1] = transform.position2D.y;
    positions2D[b3 + 2] = -0.2; // Collapses below substrate

    scales2D[b3] = 0; // Collapses to 0 scale in scan mode
    scales2D[b3 + 1] = 0;
    scales2D[b3 + 2] = 0;

    colors3D[b3] = tempColor.r;
    colors3D[b3 + 1] = tempColor.g;
    colors3D[b3 + 2] = tempColor.b;
  }

  setupGPUMorphAttributes(
    boxGeometry,
    {
      count: totalInstances,
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
      // GPU uniform update
      morphUniforms.uMorphProgress.value = morphProgress;

      const easedT = easeInOutCubic(morphProgress);
      substrateMaterial.opacity = easedT;
      substrateMesh.visible = easedT > 0.01;

      if (morphProgress > 0.85) {
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
