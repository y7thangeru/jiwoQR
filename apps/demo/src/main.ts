import { JiwoWebGLRenderer, RenderMode, RenderModel } from '@jiwoqr/renderer-webgl';
import { JiwoQREntity } from '@jiwoqr/core';
import {
  exportGLB,
  exportSTL,
  exportPNG,
  exportSVG,
  downloadFile,
} from '@jiwoqr/exporter';

const container = document.getElementById('canvas-container') as HTMLDivElement;
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const btnApply = document.getElementById('btn-apply') as HTMLButtonElement;
const btnModeToggle = document.getElementById('btn-mode-toggle') as HTMLButtonElement;
const btnGyroToggle = document.getElementById('btn-gyro-toggle') as HTMLButtonElement;
const gyroText = document.getElementById('gyro-text') as HTMLSpanElement;
const morphSlider = document.getElementById('morph-slider') as HTMLInputElement;
const morphValueLabel = document.getElementById('morph-value') as HTMLSpanElement;
const presetChips = document.querySelectorAll('.preset-chip');
const modelButtons = document.querySelectorAll<HTMLButtonElement>('.model-btn');

// Export toolbar buttons
const btnExportGLB = document.getElementById('btn-export-glb') as HTMLButtonElement;
const btnExportSTL = document.getElementById('btn-export-stl') as HTMLButtonElement;
const btnExportPNG = document.getElementById('btn-export-png') as HTMLButtonElement;
const btnExportSVG = document.getElementById('btn-export-svg') as HTMLButtonElement;

// Telemetry DOM elements
const dnaHashEl = document.getElementById('dna-hash') as HTMLSpanElement;
const dnaSeedEl = document.getElementById('dna-seed') as HTMLSpanElement;
const qrSpecsEl = document.getElementById('qr-specs') as HTMLSpanElement;
const dnaTowerEl = document.getElementById('dna-tower') as HTMLSpanElement;
const dnaHeightEl = document.getElementById('dna-height') as HTMLSpanElement;
const dnaRoofEl = document.getElementById('dna-roof') as HTMLSpanElement;
const paletteChipsEl = document.getElementById('palette-chips') as HTMLDivElement;
const scanGuardDesc = document.getElementById('scan-guard-desc') as HTMLDivElement;

// 1. Instantiate JiwoWebGLRenderer
const renderer = new JiwoWebGLRenderer({
  container,
  model: 'architecture',
  mode: '3d',
  morphDuration: 900,
});

// Load initial payload
renderer.setData(urlInput.value);
updateTelemetry(renderer.getEntity());

// 2. Telemetry update function
function updateTelemetry(entity?: JiwoQREntity) {
  if (!entity) return;

  const { dna, matrix } = entity;
  dnaHashEl.textContent = '0x' + dna.rawHash.toString(16).slice(-8);
  dnaSeedEl.textContent = dna.seed32.toString();
  qrSpecsEl.textContent = `v${matrix.version} (${matrix.totalSize}x${matrix.totalSize}) [ECC ${matrix.ecc}]`;

  const currentModel = renderer.getModel();
  if (currentModel === 'globe') {
    dnaTowerEl.textContent = `SATELLITES: ${dna.globe.satelliteCount}`;
    dnaHeightEl.textContent = `Elev: ${dna.globe.continentElevation} (depth: ${dna.globe.oceanDepth})`;
    dnaRoofEl.textContent = `SPEED: ${dna.globe.rotationSpeed}x`;
  } else if (currentModel === 'circuit') {
    const chip = dna.circuit?.chipPackage?.toUpperCase() ?? 'QFP';
    const mask = dna.circuit?.solderMaskColor?.toUpperCase() ?? 'GREEN';
    const trace = dna.circuit?.traceStyle?.toUpperCase() ?? 'ORTHO';
    dnaTowerEl.textContent = `IC: ${chip}`;
    dnaHeightEl.textContent = `PCB: ${mask} mask`;
    dnaRoofEl.textContent = `TRACE: ${trace}`;
  } else {
    dnaTowerEl.textContent = dna.architecture.towerArchetype.toUpperCase();
    dnaHeightEl.textContent = `${dna.architecture.maxHeight}x (var: ${dna.architecture.heightVariance})`;
    dnaRoofEl.textContent = dna.architecture.roofStyle.toUpperCase();
  }


  // Render palette chips
  paletteChipsEl.innerHTML = '';
  const colors = [
    { label: 'Primary', val: dna.palette.primary },
    { label: 'Secondary', val: dna.palette.secondary },
    { label: 'Accent', val: dna.palette.accent },
    { label: 'Substrate', val: dna.palette.groundSubstrate },
    { label: 'Finder Glow', val: dna.palette.finderEmissive },
  ];

  for (const c of colors) {
    const chip = document.createElement('div');
    chip.className = 'palette-chip';
    chip.style.backgroundColor = c.val;
    chip.title = `${c.label}: ${c.val}`;
    paletteChipsEl.appendChild(chip);
  }
}

// 3. Handle URL Generation & Presets
function applyUrl(url: string) {
  urlInput.value = url;
  renderer.setData(url);
  updateTelemetry(renderer.getEntity());
}

btnApply.addEventListener('click', () => {
  if (urlInput.value.trim()) {
    applyUrl(urlInput.value);
  }
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && urlInput.value.trim()) {
    applyUrl(urlInput.value);
  }
});

presetChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const url = chip.getAttribute('data-url');
    if (url) applyUrl(url);
  });
});

// Model Archetype Switcher (Architecture vs Globe vs Circuit)
modelButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const model = btn.getAttribute('data-model') as RenderModel;
    if (model) {
      modelButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderer.setModel(model);
      updateTelemetry(renderer.getEntity());
    }
  });
});

// 4. Mode Toggle (3D Interactive vs 2D Scan Mode)
function updateUIForMode(mode: RenderMode, progress: number) {
  morphSlider.value = progress.toString();

  if (mode === 'scan') {
    btnModeToggle.classList.add('active-scan');
    btnModeToggle.innerHTML = `
      <span class="mode-icon">🌐</span>
      <span class="mode-text">Switch to 3D World</span>
    `;
    morphValueLabel.textContent = `2D SCAN MODE (${progress.toFixed(2)})`;
    morphValueLabel.style.color = '#ff0055';
    scanGuardDesc.textContent =
      '100% Binary contrast and 4-module Quiet Zone active. Camera angle perpendicular: Ready for instant phone scan!';
  } else {
    btnModeToggle.classList.remove('active-scan');
    btnModeToggle.innerHTML = `
      <span class="mode-icon">📷</span>
      <span class="mode-text">Switch to Scan Mode (2D)</span>
    `;
    morphValueLabel.textContent = `3D WORLD (${progress.toFixed(2)})`;
    morphValueLabel.style.color = '#00f0ff';
    scanGuardDesc.textContent =
      'Interact with 3D model. Switch to Scan Mode to align camera and flatten modules for immediate phone scanning.';
  }
}

btnModeToggle.addEventListener('click', () => {
  const currentMode = renderer.getMode();
  const nextMode: RenderMode = currentMode === '3d' ? 'scan' : '3d';
  renderer.setMode(nextMode);
});

// 5. Morph Slider Interaction
morphSlider.addEventListener('input', () => {
  const progress = parseFloat(morphSlider.value);
  renderer.setMorphProgress(progress);
  updateUIForMode(progress > 0.5 ? 'scan' : '3d', progress);
});

// 6. Export Toolbar Handlers
btnExportGLB?.addEventListener('click', async () => {
  try {
    btnExportGLB.disabled = true;
    btnExportGLB.textContent = 'Exporting...';
    const glbBuffer = await exportGLB(renderer.getScene(), { binary: true });
    downloadFile(glbBuffer, `jiwoqr-${renderer.getModel()}.glb`, 'model/gltf-binary');
  } catch (err) {
    console.error('Failed to export GLB', err);
    alert('GLB Export error: ' + String(err));
  } finally {
    btnExportGLB.disabled = false;
    btnExportGLB.innerHTML = '<span class="export-icon">📦</span><span class="export-label">Export GLB</span>';
  }
});

btnExportSTL?.addEventListener('click', () => {
  const entity = renderer.getEntity();
  if (!entity) return;
  try {
    const currentModel = renderer.getModel();
    const stlBuffer = exportSTL(entity.matrix, entity.dna, {
      model: currentModel,
      moduleSize: 2.0,
      baseThickness: 2.0,
      maxHeight: 7.0,
    });
    downloadFile(stlBuffer, `jiwoqr-${currentModel}-3dprint.stl`, 'application/sla');
  } catch (err) {
    console.error('Failed to export STL', err);
    alert('STL Export error: ' + String(err));
  }
});


btnExportPNG?.addEventListener('click', async () => {
  const entity = renderer.getEntity();
  if (!entity) return;
  try {
    btnExportPNG.disabled = true;
    btnExportPNG.textContent = 'Rendering...';
    const pngBlob = await exportPNG(entity.matrix, { size: 2048 });
    downloadFile(pngBlob, `jiwoqr-300dpi.png`, 'image/png');
  } catch (err) {
    console.error('Failed to export PNG', err);
    alert('PNG Export error: ' + String(err));
  } finally {
    btnExportPNG.disabled = false;
    btnExportPNG.innerHTML = '<span class="export-icon">🖼️</span><span class="export-label">Export PNG (300 DPI)</span>';
  }
});

btnExportSVG?.addEventListener('click', () => {
  const entity = renderer.getEntity();
  if (!entity) return;
  try {
    const svgStr = exportSVG(entity.matrix);
    downloadFile(svgStr, `jiwoqr-vector.svg`, 'image/svg+xml');
  } catch (err) {
    console.error('Failed to export SVG', err);
    alert('SVG Export error: ' + String(err));
  }
});

// 7. Device Orientation (Gyroscope Tilt)
let isGyroActive = false;

function onDeviceOrientation(e: DeviceOrientationEvent) {
  if (!isGyroActive) return;
  if (e.gamma !== null && e.beta !== null) {
    renderer.getCameraController().applyGyroTilt(e.gamma, e.beta);
  }
}

btnGyroToggle?.addEventListener('click', async () => {
  if (!isGyroActive) {
    // Check for iOS 13+ permission request
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DeviceOrientation !== 'undefined' && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientation.requestPermission();
        if (perm !== 'granted') {
          alert('Device orientation permission denied');
          return;
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
      }
    }

    window.addEventListener('deviceorientation', onDeviceOrientation);
    isGyroActive = true;
    btnGyroToggle.classList.add('active');
    gyroText.textContent = 'Gyro: ON';
  } else {
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    isGyroActive = false;
    btnGyroToggle.classList.remove('active');
    gyroText.textContent = 'Gyro: OFF';
  }
});

// 8. Animation frame loop to sync slider when animating
function syncUI() {
  const progress = renderer.getMorphProgress();
  const mode = renderer.getMode();

  if (Math.abs(parseFloat(morphSlider.value) - progress) > 0.005) {
    updateUIForMode(mode, progress);
  }

  requestAnimationFrame(syncUI);
}
requestAnimationFrame(syncUI);

