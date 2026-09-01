import * as THREE from 'three';
import { QRMatrix, DeterministicDNA, QRModule } from '@jiwoqr/core';
import {
  CircuitModuleTransform,
  computeCircuitModuleTransform,
  interpolateCircuitMorph,
  easeInOutCubic,
} from '@jiwoqr/math';

export interface CircuitModelInstance {
  group: THREE.Group;
  update(morphProgress: number): void;
  dispose(): void;
  getQRWorldBounds(): { width: number; height: number };
}

const COLOR_BLACK = new THREE.Color(0x000000);
const COLOR_WHITE = new THREE.Color(0xffffff);

interface ModuleMetadata {
  transform: CircuitModuleTransform;
  color3D: THREE.Color;
  isFinder: boolean;
}

const SOLDER_MASK_COLORS: Record<string, number> = {
  green: 0x0a2618,
  black: 0x0e1116,
  blue: 0x0d1f38,
  purple: 0x1e1030,
};

export function createCircuitModel(
  matrix: QRMatrix,
  dna: DeterministicDNA,
  options: { moduleSize?: number; gap?: number } = {}
): CircuitModelInstance {
  const group = new THREE.Group();
  group.name = 'JiwoCircuitModel';

  const moduleSize = options.moduleSize ?? 1.0;
  const gap = options.gap ?? 0.04;
  const unit = moduleSize + gap;
  const totalGridSize = matrix.totalSize;
  const totalWorldSize = totalGridSize * unit;

  // 1. Collect all dark modules (SMD components, traces, IC packages)
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

  // 2. Base PCB Substrate Plate (Solder mask)
  const substrateGeometry = new THREE.PlaneGeometry(
    totalWorldSize + unit * 0.5,
    totalWorldSize + unit * 0.5
  );

  const solderMaskHex = SOLDER_MASK_COLORS[dna.circuit?.solderMaskColor ?? 'green'] ?? 0x0a2618;

  const substrate3DColor = new THREE.Color(solderMaskHex);
  const substrateMaterial = new THREE.MeshStandardMaterial({
    color: substrate3DColor.clone(),
    roughness: 0.6,
    metalness: 0.2,
  });

  const substrateMesh = new THREE.Mesh(substrateGeometry, substrateMaterial);
  substrateMesh.name = 'PCBSubstratePlate';
  substrateMesh.position.set(0, 0, 0);
  group.add(substrateMesh);

  // 3. InstancedMesh for Electronic Components
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const componentMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true,
  });

  const instancedMesh = new THREE.InstancedMesh(boxGeometry, componentMaterial, count);
  instancedMesh.name = 'CircuitSMDComponents';
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

  // 4. Precompute Transforms & Component Palette Colors
  const metadata: ModuleMetadata[] = [];
  const finderColor = new THREE.Color(dna.palette.finderEmissive);
  const copperColor = new THREE.Color(0xd48b48);
  const goldColor = new THREE.Color(0xd4af37);
  const resistorBodyColor = new THREE.Color(0x181a1f);
  const capacitorColor = new THREE.Color(0x9c7a52);

  for (let i = 0; i < count; i++) {
    const { raw, isFinder } = darkModules[i];
    const transform = computeCircuitModuleTransform(
      raw.x,
      raw.y,
      totalGridSize,
      raw.isDark,
      isFinder,
      dna.seed32,
      { moduleSize, gap, chipElevation: 0.75 }
    );

    let color3D: THREE.Color;
    if (isFinder) {
      // Main QFP Microprocessor IC Chip package
      color3D = finderColor.clone();
    } else {
      switch (transform.componentType) {
        case 'RESISTOR':
          color3D = resistorBodyColor.clone();
          break;
        case 'CAPACITOR':
          color3D = capacitorColor.clone();
          break;
        case 'VIA_PAD':
          color3D = goldColor.clone();
          break;
        case 'TRACE_H':
        case 'TRACE_V':
        default:
          color3D = copperColor.clone();
          break;
      }
    }

    metadata.push({ transform, color3D, isFinder });
  }

  // 5. Morph Application
  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  function applyMorph(t: number) {
    const easedT = easeInOutCubic(t);

    for (let i = 0; i < count; i++) {
      const item = metadata[i];
      const { position, scale, rotationZ } = interpolateCircuitMorph(item.transform, t);

      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.set(scale.x, scale.y, scale.z);
      dummy.rotation.set(0, 0, rotationZ);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // In 3D: Cyber electronic component colors. In Scan Mode: pitch black.
      tempColor.copy(item.color3D).lerp(COLOR_BLACK, easedT);
      instancedMesh.setColorAt(i, tempColor);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // PCB substrate interpolates from solder mask color to solid white in scan mode
    substrateMaterial.color.copy(substrate3DColor).lerp(COLOR_WHITE, easedT);

    // Lighting & shadow mitigation in scan mode
    if (t > 0.85) {
      instancedMesh.castShadow = false;
      instancedMesh.receiveShadow = false;
      componentMaterial.roughness = 1.0;
      componentMaterial.metalness = 0.0;
    } else {
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      componentMaterial.roughness = 0.3;
      componentMaterial.metalness = 0.7;
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
      componentMaterial.dispose();
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
