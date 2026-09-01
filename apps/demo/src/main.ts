import { JiwoWebGLRenderer, RenderMode, RenderModel } from '@jiwoqr/renderer-webgl';
import { JiwoQREntity } from '@jiwoqr/core';

const container = document.getElementById('canvas-container') as HTMLDivElement;
const urlInput = document.getElementById('url-input') as HTMLInputElement;
const btnApply = document.getElementById('btn-apply') as HTMLButtonElement;
const btnModeToggle = document.getElementById('btn-mode-toggle') as HTMLButtonElement;
const morphSlider = document.getElementById('morph-slider') as HTMLInputElement;
const morphValueLabel = document.getElementById('morph-value') as HTMLSpanElement;
const presetChips = document.querySelectorAll('.preset-chip');
const modelButtons = document.querySelectorAll<HTMLButtonElement>('.model-btn');

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

// Model Archetype Switcher (Architecture vs Globe)
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

// 6. Animation frame loop to sync slider when animating
function syncUI() {
  const progress = renderer.getMorphProgress();
  const mode = renderer.getMode();

  if (Math.abs(parseFloat(morphSlider.value) - progress) > 0.005) {
    updateUIForMode(mode, progress);
  }

  requestAnimationFrame(syncUI);
}
requestAnimationFrame(syncUI);
