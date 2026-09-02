import {
  JiwoWebGLRenderer,
  RenderMode,
  RenderModel,
  requestDeviceOrientationPermission,
} from '@jiwoqr/renderer-webgl';
import { JiwoQREntity, ECCLevel, createJiwoQR, ColorPalette } from '@jiwoqr/core';
import {
  exportGLB,
  exportSTL,
  exportPNG,
  exportSVG,
  downloadFile,
} from '@jiwoqr/exporter';

// DOM Elements
const container = document.getElementById('canvas-container') as HTMLDivElement;
const urlInput = document.getElementById('url-input') as HTMLTextAreaElement;
const btnApply = document.getElementById('btn-apply') as HTMLButtonElement;
const btnModeToggle = document.getElementById('btn-mode-toggle') as HTMLButtonElement;
const btnGyroToggle = document.getElementById('btn-gyro-toggle') as HTMLButtonElement;
const gyroText = document.getElementById('gyro-text') as HTMLSpanElement;
const morphSlider = document.getElementById('morph-slider') as HTMLInputElement;
const morphValueLabel = document.getElementById('morph-value') as HTMLSpanElement;
const presetChips = document.querySelectorAll('.preset-chip');
const modelButtons = document.querySelectorAll<HTMLButtonElement>('.model-btn');
const templateButtons = document.querySelectorAll<HTMLButtonElement>('.template-btn');
const eccButtons = document.querySelectorAll<HTMLButtonElement>('.ecc-btn');
const eccDescBadge = document.getElementById('ecc-desc-badge') as HTMLSpanElement;
const themeButtons = document.querySelectorAll<HTMLButtonElement>('.theme-btn');
const themeNameBadge = document.getElementById('theme-name-badge') as HTMLSpanElement;
const customColorControls = document.getElementById('custom-color-controls') as HTMLDivElement;

const pickerPrimary = document.getElementById('picker-primary') as HTMLInputElement;
const pickerSecondary = document.getElementById('picker-secondary') as HTMLInputElement;
const pickerAccent = document.getElementById('picker-accent') as HTMLInputElement;
const pickerBg = document.getElementById('picker-bg') as HTMLInputElement;

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

// State
let currentECC: ECCLevel = 'Q';
let currentTheme = 'auto';

// Preset theme definitions
const THEME_PALETTES: Record<string, ColorPalette> = {
  'cyber-neon': {
    primary: '#00f0ff',
    secondary: '#ff0055',
    accent: '#ffe600',
    background: '#05070f',
    groundSubstrate: '#0b1021',
    finderEmissive: '#00ffff',
  },
  'obsidian-gold': {
    primary: '#d4af37',
    secondary: '#aa7c11',
    accent: '#f39c12',
    background: '#0d0f12',
    groundSubstrate: '#181b20',
    finderEmissive: '#ffd700',
  },
  'emerald-tech': {
    primary: '#2ecc71',
    secondary: '#16a085',
    accent: '#1abc9c',
    background: '#0a1410',
    groundSubstrate: '#0f2019',
    finderEmissive: '#00ff88',
  },
  'minimalist-mono': {
    primary: '#e0e6ed',
    secondary: '#8492a6',
    accent: '#3b82f6',
    background: '#090b10',
    groundSubstrate: '#141824',
    finderEmissive: '#60a5fa',
  },
};

// 1. Instantiate JiwoWebGLRenderer
const renderer = new JiwoWebGLRenderer({
  container,
  model: 'architecture',
  mode: '3d',
  morphDuration: 850,
});

// Helper to construct JiwoQREntity with current customizer settings
function buildCurrentEntity(payload: string): JiwoQREntity {
  const entity = createJiwoQR(payload, { ecc: currentECC });

  // Apply theme override if not 'auto'
  if (currentTheme in THEME_PALETTES) {
    entity.dna.palette = { ...THEME_PALETTES[currentTheme] };
  } else if (currentTheme === 'custom') {
    entity.dna.palette = {
      primary: pickerPrimary.value,
      secondary: pickerSecondary.value,
      accent: pickerAccent.value,
      background: pickerBg.value,
      groundSubstrate: pickerBg.value,
      finderEmissive: pickerAccent.value,
    };
  }

  return entity;
}

function applyCurrentState() {
  const entity = buildCurrentEntity(urlInput.value);
  renderer.setEntity(entity);
  updateTelemetry(entity);
}

// Initial load
applyCurrentState();

// Dynamic Discovery & Preloading of Custom STL Building Models (Model 5)
async function initBuildingModels() {
  try {
    const res = await fetch('/api/building-models');
    if (res.ok) {
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        console.log(`[JiwoQR] Discovered ${data.count} 3D STL building models in STL-for-buildingModels:`, data.models);
        await renderer.loadCityModels(data.models);
      }
    }
  } catch (err) {
    console.warn('[JiwoQR] Auto-discovery of STL building models:', err);
  }
}
initBuildingModels();

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
  } else if (currentModel === 'biomorphic') {
    const style = dna.biomorphic?.crystalGrowthStyle?.toUpperCase() ?? 'HEXAGONAL';
    const ior = dna.biomorphic?.refractionIndex ?? 1.55;
    const sharp = dna.biomorphic?.facetSharpness ?? 0.8;
    dnaTowerEl.textContent = `CRYSTAL: ${style}`;
    dnaHeightEl.textContent = `IOR: ${ior} (sharp: ${sharp})`;
    dnaRoofEl.textContent = `DENSITY: ${dna.biomorphic?.clusterDensity ?? 0.5}`;
  } else if (currentModel === 'city') {
    const zone = dna.city?.zoningArchetype?.toUpperCase() ?? 'DOWNTOWN';
    const land = dna.city?.landmarkStyle?.toUpperCase() ?? 'TOWER';
    const dens = dna.city?.skylineDensity ?? 0.8;
    dnaTowerEl.textContent = `ZONE: ${zone}`;
    dnaHeightEl.textContent = `DENSITY: ${dens} (Scale: ${dna.city?.buildingScale ?? 1.0})`;
    dnaRoofEl.textContent = `LANDMARK: ${land}`;
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

// 3. Payload Templates & Presets
const TEMPLATES = {
  url: 'https://github.com/AlbertAZ1992/every-qrcode',
  vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Satria;Jiwo;;;\nFN:Jiwo Satria\nORG:JiwoQR Studio\nTEL:+6281234567890\nEMAIL:jiwo@example.com\nURL:https://jiwoqr.dev\nEND:VCARD`,
  wifi: `WIFI:S:JiwoQR-UltraNet;T:WPA;P:SuperSecretPass2026;;`,
};

templateButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    templateButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.getAttribute('data-type') as keyof typeof TEMPLATES;
    if (TEMPLATES[type]) {
      urlInput.value = TEMPLATES[type];
      applyCurrentState();
    }
  });
});

presetChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const url = chip.getAttribute('data-url');
    if (url) {
      urlInput.value = url;
      applyCurrentState();
    }
  });
});

btnApply.addEventListener('click', () => {
  if (urlInput.value.trim()) {
    applyCurrentState();
  }
});

// 4. ECC Selector Handlers
const ECC_DESCRIPTIONS: Record<ECCLevel, string> = {
  L: 'ECC L (~7% - Maximum Data Density)',
  M: 'ECC M (~15% - Standard Density)',
  Q: 'ECC Q (~25% - Recommended for 3D Relief)',
  H: 'ECC H (~30% - Maximum Recovery)',
};

eccButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const ecc = btn.getAttribute('data-ecc') as ECCLevel;
    if (ecc && ecc !== currentECC) {
      currentECC = ecc;
      eccButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      eccDescBadge.textContent = ECC_DESCRIPTIONS[ecc];
      applyCurrentState();
    }
  });
});

// 5. Theme Switcher Handlers
themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme');
    if (theme) {
      currentTheme = theme;
      themeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (theme === 'custom') {
        customColorControls.style.display = 'grid';
        themeNameBadge.textContent = 'Custom Hex';
      } else {
        customColorControls.style.display = 'none';
        themeNameBadge.textContent = theme === 'auto' ? 'Procedural DNA' : btn.textContent || theme;
      }

      applyCurrentState();
    }
  });
});

[pickerPrimary, pickerSecondary, pickerAccent, pickerBg].forEach((picker) => {
  picker?.addEventListener('input', () => {
    if (currentTheme === 'custom') {
      applyCurrentState();
    }
  });
});

// 6. Model Archetype Switcher (Architecture vs Globe vs Circuit vs Biomorphic)
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

// 7. Mode Toggle (3D Interactive vs 2D Scan Mode)
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

// 8. Morph Slider Interaction (Scrubbing GPU Uniform directly)
morphSlider.addEventListener('input', () => {
  const progress = parseFloat(morphSlider.value);
  renderer.setMorphProgress(progress);
  updateUIForMode(progress > 0.5 ? 'scan' : '3d', progress);
});

// 9. Export Toolbar Handlers
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

// 10. Device Orientation (iOS Safari & Standard Gyroscope Tilt)
let isGyroActive = false;

function onDeviceOrientation(e: DeviceOrientationEvent) {
  if (!isGyroActive) return;
  if (e.gamma !== null && e.beta !== null) {
    renderer.getCameraController().applyGyroTilt(e.gamma, e.beta);
  }
}

btnGyroToggle?.addEventListener('click', async () => {
  if (!isGyroActive) {
    // Standardized iOS 13+ and Android gyroscope permission handler
    const granted = await requestDeviceOrientationPermission();
    if (!granted) {
      alert('Device orientation permission was denied.');
      return;
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

// 11. Animation frame loop to sync slider when animating
function syncUI() {
  const progress = renderer.getMorphProgress();
  const mode = renderer.getMode();

  if (Math.abs(parseFloat(morphSlider.value) - progress) > 0.005) {
    updateUIForMode(mode, progress);
  }

  requestAnimationFrame(syncUI);
}
requestAnimationFrame(syncUI);
