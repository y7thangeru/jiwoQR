import * as THREE from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { exportGLB } from './glb.js';
import { downloadFile } from './utils.js';
import { ARCapabilities, ARLaunchOptions, USDZExportOptions } from './types.js';

/**
 * Exports a Three.js scene or 3D object to binary USDZ format.
 */
export async function exportUSDZ(
  input: THREE.Object3D | THREE.Scene,
  options: USDZExportOptions = {}
): Promise<Uint8Array> {
  const exporter = new USDZExporter();
  if (typeof exporter.parseAsync === 'function') {
    return await exporter.parseAsync(input, {
      maxTextureSize: options.maxTextureSize ?? 2048,
      quickLookCompatible: true,
    });
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    exporter.parse(
      input,
      (result: Uint8Array) => resolve(result),
      (error: unknown) => reject(error),
      {
        maxTextureSize: options.maxTextureSize ?? 2048,
        quickLookCompatible: true,
      }
    );
  });
}

/**
 * Generates an in-memory USDZ Blob suitable for iOS AR Quick Look.
 */
export async function generateUSDZBlob(
  input: THREE.Object3D | THREE.Scene,
  options: USDZExportOptions = {}
): Promise<Blob> {
  const data = await exportUSDZ(input, options);
  // Ensure typed array buffer is converted to a clean standalone ArrayBuffer
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy.buffer as ArrayBuffer], { type: 'model/vnd.usdz+zip' });
}

/**
 * Formats an Android Google Scene Viewer intent URL for native ARCore preview.
 */
export function getAndroidSceneViewerUrl(glbUrl: string, title: string = 'JiwoQR 3D Model'): string {
  const encodedGlb = encodeURIComponent(glbUrl);
  const encodedTitle = encodeURIComponent(title);
  return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedGlb}&mode=ar_only&title=${encodedTitle}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;`;
}

/**
 * Detects whether the current client device supports native mobile AR (iOS Quick Look or Android Scene Viewer).
 */
export function detectARCapabilities(): ARCapabilities {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, isAndroid: false, isARAvailable: false };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isARAvailable = isIOS || isAndroid;

  return {
    isIOS,
    isAndroid,
    isARAvailable,
  };
}

/**
 * Triggers native iOS AR Quick Look by generating a temporary anchor with rel="ar".
 */
export function launchARQuickLook(usdzBlob: Blob, filename = 'jiwoqr-ar.usdz'): void {
  const blobUrl = URL.createObjectURL(usdzBlob);
  const anchor = document.createElement('a');
  anchor.setAttribute('rel', 'ar');
  anchor.setAttribute('href', blobUrl);
  anchor.setAttribute('download', filename);

  // iOS Quick Look expects an img child inside the anchor
  const img = document.createElement('img');
  img.setAttribute('alt', 'AR Quick Look');
  img.style.display = 'none';
  anchor.appendChild(img);

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}

/**
 * Universal AR Launcher for mobile web:
 * - On iOS: exports scene to USDZ blob and launches iOS AR Quick Look natively.
 * - On Android: opens Google Scene Viewer via Android intent (or falls back to GLB export).
 * - On Desktop / Unsupported: downloads GLB model with user guidance.
 */
export async function launchARView(options: ARLaunchOptions): Promise<void> {
  const caps = detectARCapabilities();
  const modelName = options.modelName || 'architecture';
  const title = options.title || `JiwoQR — ${modelName.toUpperCase()}`;

  if (caps.isIOS) {
    // 1. Native iOS AR Quick Look
    const usdzBlob = await generateUSDZBlob(options.scene);
    launchARQuickLook(usdzBlob, `jiwoqr-${modelName}.usdz`);
  } else if (caps.isAndroid) {
    // 2. Android Scene Viewer
    if (options.glbUrl && (options.glbUrl.startsWith('http://') || options.glbUrl.startsWith('https://'))) {
      const intentUrl = getAndroidSceneViewerUrl(options.glbUrl, title);
      window.location.href = intentUrl;
    } else {
      // If running locally or no public URL is available, export GLB and download
      const glbBuf = await exportGLB(options.scene, { binary: true });
      downloadFile(glbBuf, `jiwoqr-${modelName}.glb`, 'model/gltf-binary');
      alert('Android AR: Exported GLB model. Open in Scene Viewer or Files to view in augmented reality.');
    }
  } else {
    // 3. Desktop / Web fallback
    const glbBuf = await exportGLB(options.scene, { binary: true });
    downloadFile(glbBuf, `jiwoqr-${modelName}.glb`, 'model/gltf-binary');
    alert('AR Mobile View: On an iOS or Android device, tapping "View in AR" launches native AR Quick Look or Google Scene Viewer. The 3D GLB model has been downloaded to your desktop.');
  }
}
