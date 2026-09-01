import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLBExportOptions } from './types.js';

/**
 * Exports a Three.js scene or 3D object to a standard binary GLTF (.glb) buffer.
 */
export async function exportGLB(
  input: THREE.Object3D | THREE.Scene,
  options: GLBExportOptions = {}
): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      input,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // In case JSON format is returned
          const jsonStr = JSON.stringify(result);
          const buf = new TextEncoder().encode(jsonStr).buffer;
          resolve(buf);
        }
      },
      (error) => {
        reject(error);
      },
      {
        binary: options.binary ?? true,
        onlyVisible: options.onlyVisible ?? true,
        animations: options.animations,
      }
    );
  });
}
