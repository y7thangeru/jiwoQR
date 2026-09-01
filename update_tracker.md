# JiwoQR - Update Tracker

This file tracks all file creations, modifications, and deletions in the repository, along with detailed engineering rationale.

---

## [2026-09-01] Initial Monorepo Setup & Core Foundation

### 1. Workspace Configuration
- `pnpm-workspace.yaml` [NEW]:
  - **Rationale**: Declares monorepo workspaces for all packages in `packages/*` and applications in `apps/*`, and configures `onlyBuiltDependencies: [esbuild]` for pnpm v12.
- `package.json` [NEW]:
  - **Rationale**: Root package manifest declaring package manager (`pnpm@12.2.1`), root scripts (`build`, `test`, `typecheck`, `dev`), and devDependencies (`typescript`, `vitest`).
- `tsconfig.base.json` [NEW]:
  - **Rationale**: Base TypeScript configuration with strict typing, ES2022 target, Bundler resolution, and type declaration emission.
- `.npmrc` [NEW]:
  - **Rationale**: Configures pnpm security settings for build scripts (`only-built-dependencies=esbuild`).
- `update_tracker.md` [NEW]:
  - **Rationale**: Project-level audit log required for documentation integrity and continuous change tracking.

### 2. `@jiwoqr/core` Package
- `packages/core/package.json` [NEW]:
  - **Rationale**: Package definition for `@jiwoqr/core` with zero runtime dependencies.
- `packages/core/tsconfig.json` [NEW]:
  - **Rationale**: Extends `tsconfig.base.json` for building core module.
- `packages/core/src/types.ts` [NEW]:
  - **Rationale**: Core types for QR modules, error correction levels, matrix representations, and deterministic DNA.
- `packages/core/src/dna/hasher.ts` [NEW]:
  - **Rationale**: 64-bit FNV-1a hashing function for deterministic seed generation from strings/URLs.
- `packages/core/src/dna/prng.ts` [NEW]:
  - **Rationale**: Mulberry32 pseudo-random number generator with safe BigInt-to-uint32 conversion (`BigInt.asUintN(32, hash64)`).
- `packages/core/src/dna/generator.ts` [NEW]:
  - **Rationale**: Generates deterministic visual DNA (palette, heights, architectural features, landmark styles).
- `packages/core/src/qr/reed-solomon.ts` [NEW]:
  - **Rationale**: Pure TypeScript Galois Field GF(256) arithmetic and Reed-Solomon polynomial division for ECC.
- `packages/core/src/qr/tables.ts` [NEW]:
  - **Rationale**: ISO/IEC 18004 specification tables for capacity, alignment patterns, and BCH format info.
- `packages/core/src/qr/encoder.ts` [NEW]:
  - **Rationale**: Pure TypeScript ISO/IEC 18004 QR encoder with bitstream encoding, masking, and semantic module classification (`FINDER`, `ALIGNMENT`, `TIMING`, `DARK`, `DATA`, `QUIET`).
- `packages/core/src/index.ts` [NEW]:
  - **Rationale**: Public API entry point for `@jiwoqr/core`.
- `packages/core/tests/core.test.ts` [NEW]:
  - **Rationale**: Unit tests verifying QR matrix encoding, finder patterns, Reed-Solomon ECC, and deterministic DNA reproducibility.

### 3. `@jiwoqr/math` Package
- `packages/math/package.json` [NEW]:
  - **Rationale**: Package definition for `@jiwoqr/math`.
- `packages/math/tsconfig.json` [NEW]:
  - **Rationale**: Extends `tsconfig.base.json` for building math module.
- `packages/math/src/types.ts` [NEW]:
  - **Rationale**: Defines vector types (`Vec2`, `Vec3`) and extrusion/spherical module transform interfaces.
- `packages/math/src/easing.ts` [NEW]:
  - **Rationale**: Interpolation and easing curves (`lerp`, `lerpVec3`, `easeInOutCubic`, `smoothstep`).
- `packages/math/src/projections/extrusion.ts` [NEW]:
  - **Rationale**: 3D elevation calculation, landmark finder tower elevation multiplier, and 3D-to-2D morph interpolation.
- `packages/math/src/projections/spherical.ts` [NEW]:
  - **Rationale**: Cube-to-sphere distortion-free projection and spherical UV polar coordinate mappings for Globe model.
- `packages/math/src/index.ts` [NEW]:
  - **Rationale**: Public entry point for `@jiwoqr/math`.
- `packages/math/tests/math.test.ts` [NEW]:
  - **Rationale**: Unit tests for easing bounds, extrusion determinism, finder tower heights, and spherical projections.

### 4. `@jiwoqr/renderer-webgl` Package
- `packages/renderer-webgl/package.json` [NEW]:
  - **Rationale**: Package definition for Three.js WebGL visualization engine with dependencies on `@jiwoqr/core` and `@jiwoqr/math`.
- `packages/renderer-webgl/tsconfig.json` [NEW]:
  - **Rationale**: Extends `tsconfig.base.json`.
- `packages/renderer-webgl/src/types.ts` [NEW]:
  - **Rationale**: Options and model/mode type definitions (`architecture`, `globe`, `3d`, `scan`).
- `packages/renderer-webgl/src/models/architecture.ts` [NEW]:
  - **Rationale**: High-performance procedural brutalist/cyber cityscape renderer using Three.js `InstancedMesh` with `DynamicDrawUsage`. Finder patterns rendered as landmark towers. Substrate plate with 4-module quiet zone dynamically interpolates to pure white and modules to pitch black in scan mode.
- `packages/renderer-webgl/src/scene/camera-controller.ts` [NEW]:
  - **Rationale**: Smooth camera controller with orbit drag in 3D mode and smooth interpolation to perpendicular top-down orthographic-style alignment in scan mode.
- `packages/renderer-webgl/src/renderer.ts` [NEW]:
  - **Rationale**: Main `JiwoWebGLRenderer` engine managing render loop, directional and ambient lighting, shadow mitigation in scan mode, resize observers, and morph transitions.
- `packages/renderer-webgl/src/index.ts` [NEW]:
  - **Rationale**: Public exports for WebGL renderer.

### 5. Future Packages Scaffolding
- `packages/renderer-webgpu/` [NEW]:
  - `package.json`, `tsconfig.json`, `src/types.ts`, `src/index.ts`
  - **Rationale**: Foundational contracts and WGSL pipeline interfaces.
- `packages/react/` [NEW]:
  - `package.json`, `tsconfig.json`, `src/JiwoQR.tsx`, `src/index.ts`
  - **Rationale**: First-class `<JiwoQR />` React component.
- `packages/web-component/` [NEW]:
  - `package.json`, `tsconfig.json`, `src/jiwo-qr.ts`, `src/index.ts`
  - **Rationale**: Native Custom Element `<jiwo-qr>` for zero-framework usage.

### 6. Interactive Studio App (`apps/demo`)
- `apps/demo/package.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/style.css` [NEW]:
  - **Rationale**: Web playground featuring real-time 3D interactive viewport, camera orbit, click-to-scan toggle, morph slider, and deterministic DNA telemetry readout.

---

## [2026-09-01] Globe Model (`model="globe"`) & Interactive Model Switching

### 1. `@jiwoqr/math`
- `packages/math/src/types.ts` [MODIFIED]:
  - **Rationale**: Added `isFinder`, `normal3D`, `scale3D`, `scale2D` properties to `SpherifiedModuleTransform` for smooth morph transitions.
- `packages/math/src/projections/spherical.ts` [MODIFIED]:
  - **Rationale**: Implemented `computeGlobeModuleTransform` to map QR grid to spherical geodesic surface with continent elevation and orbital beacon finders. Implemented `interpolateGlobeMorph` for continuous unrolling into flat 2D plane.
- `packages/math/tests/math.test.ts` [MODIFIED]:
  - **Rationale**: Added unit tests verifying spherical geodesic module transforms, surface normal orientations, and 3D-to-2D unrolling.

### 2. `@jiwoqr/renderer-webgl`
- `packages/renderer-webgl/src/models/globe.ts` [NEW]:
  - **Rationale**: High-performance Globe Model using `THREE.InstancedMesh` with `THREE.DynamicDrawUsage`, inner holographic ocean core sphere (`SphereGeometry`), latitude/longitude wireframe grid, and substrate plate unrolling to crisp solid white in scan mode.
- `packages/renderer-webgl/src/renderer.ts` [MODIFIED]:
  - **Rationale**: Added `setModel(model: RenderModel)` and updated `buildModel()` to dynamically instantiate and transition between `'architecture'` and `'globe'`.
- `packages/renderer-webgl/src/index.ts` [MODIFIED]:
  - **Rationale**: Exported `createGlobeModel` and `GlobeModelInstance`.

### 3. Packages Scaffolding
- `packages/react/src/JiwoQR.tsx` [MODIFIED]:
  - **Rationale**: Added `useEffect` hook listening to `model` prop changes to invoke `renderer.setModel(model)`.
- `packages/web-component/src/jiwo-qr.ts` [MODIFIED]:
  - **Rationale**: Added `model` attribute handler in `attributeChangedCallback` and public `setModel(model)` method.

### 4. Interactive Studio App (`apps/demo`)
- `apps/demo/index.html` [MODIFIED]:
  - **Rationale**: Removed `title="Coming soon"` and activated the Globe model selector button.
- `apps/demo/src/main.ts` [MODIFIED]:
  - **Rationale**: Attached click event listeners to `.model-btn` to toggle between Architecture and Globe models, and updated the telemetry HUD to display globe parameters (continental elevation, satellites, speed).

---

## [2026-09-01] Globe Model Dual-Hemisphere Voxel Mound Dome (Referenced from Terrain Mode)

### 1. `@jiwoqr/math`
- `packages/math/src/projections/spherical.ts` [MODIFIED]:
  - **Rationale**: Implemented dome mound height field formula $H(x, y) = \text{maxHeight} \times \sqrt{\max(0, 1 - (dist / R_{max})^2)}$ so module columns extrude vertically to form a smooth rounded mound.
- `packages/math/tests/math.test.ts` [MODIFIED]:
  - **Rationale**: Updated tests to verify radial height falloff and flat 2D morphing.

### 2. `@jiwoqr/renderer-webgl`
- `packages/renderer-webgl/src/models/globe.ts` [MODIFIED]:
  - **Rationale**: Replaced curved shell with true voxel mound architecture joined back-to-back at the equatorial plane $Z = 0$ (Top Mound A extruding $+Z$, Bottom Mound B extruding $-Z$). Added elevation-based color gradients (equator terracotta/substrate -> mid-altitude purple/blue -> polar peak gold/cream highlight) perfectly matching the reference Terrain visual. Collapses smoothly into canonical 2D QR matrix in Scan Mode.
  - **3D Equatorial Plane Hidden**: The square substrate plane at $Z = 0$ is now completely hidden in 3D mode (`opacity = 0`, `visible = false`), ensuring the floating voxel globe looks pure and seamless without any plate bisecting it. The white plate smoothly fades in only during Scan Mode (`t -> 1.0`).

---

## [2026-09-01] Comprehensive Project Documentation Suite

### 1. Root Monorepo
- `README.md` [NEW]:
  - **Rationale**: Created comprehensive entry-point documentation for the entire JiwoQR monorepo, detailing the core vision, cyber-brutalist architecture and voxel mound globe visual archetypes, dual-mode 3D/Scan morphing with shadow & lighting mitigation, ISO/IEC 18004 error correction guarantees, monorepo dependency graph (Mermaid), installation instructions, quick start guides (Vanilla WebGL, React, Web Component), KaTeX mathematical foundations, and package index.

### 2. Package-Level Technical Documentation
- `packages/core/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/core` detailing zero-dependency TypeScript implementation of FNV-1a 64-bit string hashing, Mulberry32 PRNG, deterministic DNA generator, Galois Field GF(256) arithmetic and Reed-Solomon polynomial division, ISO/IEC 18004 QR bitstream encoder with 8 penalty masking evaluation, 4-module quiet zone, semantic module classification, complete type definitions, and API guides.
- `packages/math/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/math` explaining vector types (`Vec2`, `Vec3`), interpolation and cubic easing curves (`easeInOutCubic`, `lerpVec3`), brutalist architectural extrusion formulas, and spherical projection / dual-hemisphere voxel mound dome height fields $H(x, y) = \text{maxHeight} \times \sqrt{\max(0, 1 - (dist / R_{max})^2)}$ for smooth 3D-to-2D planar unrolling.
- `packages/renderer-webgl/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/renderer-webgl` covering Three.js instanced rendering with `DynamicDrawUsage` buffers for 60 FPS morphing, `JiwoWebGLRenderer` lifecycle methods, Architecture & Globe model instances, camera controller with orbit and perpendicular alignment, and optical shadow/lighting mitigation system for instant phone camera readability.
- `packages/react/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/react` detailing the `<JiwoQR />` component wrapper, props interface, reactive lifecycle hooks synchronization, SSR-safe dynamic import patterns for Next.js App Router/Pages Router, and Vite React integration examples.
- `packages/web-component/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/web-component` covering the framework-agnostic native Custom Element `<jiwo-qr>`, observed HTML attributes, DOM JavaScript methods (`setMode`, `setModel`, `setMorphProgress`), and integration guides for Vanilla HTML, Vue 3, Svelte, and Angular.
- `packages/renderer-webgpu/README.md` [NEW]:
  - **Rationale**: Technical documentation for `@jiwoqr/renderer-webgpu` detailing next-generation WebGPU compute pipeline contracts, WGSL compute shaders vision, browser capability detection (`isWebGPUSupported`), and technical roadmap.

### 3. Interactive Studio Demo App
- `apps/demo/README.md` [NEW]:
  - **Rationale**: Comprehensive user and developer guide for the interactive web studio (`apps/demo`), covering 3D viewport navigation, real-time URL inputs, model switching, dual-mode 3D/Scan toggle, granular morph slider, live telemetry HUD (64-bit hash, seed, QR specs, model parameters, palette swatches), and local development workflow.

### 4. Git Repository Setup & Project Reporting
- `.gitignore` [NEW]:
  - **Rationale**: Ignores `node_modules`, build distribution outputs (`dist`), test coverage, logs, and OS cache files to keep git repository clean and lightweight.
- `Report-To-GeminiProject.md` [NEW]:
  - **Rationale**: Exhaustive, consolidated project report detailing background, problem statement, core guarantees, monorepo architecture, technical package breakdowns, 3D visual models, shadow mitigation system, verification outcomes, and running instructions for cross-thread reporting.


