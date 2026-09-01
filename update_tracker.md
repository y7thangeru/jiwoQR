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

---


## [2026-09-01] Phase 2: Core Optimization, 3D/Print Exporter, Circuit Model, & Graceful Fallback

### 1. `@jiwoqr/core` Package
- `packages/core/src/types.ts` [MODIFIED]:
  - **Rationale**: Added `QRMode = 'numeric' | 'alphanumeric' | 'byte'` and `QRModeOption = 'auto' | QRMode`. Added `CircuitDNA` interface (`traceStyle`, `chipPackage`, `solderMaskColor`, `componentDensity`, `viaDensity`, `traceWidth`), updated `DeterministicDNA` to include `circuit: CircuitDNA`, and updated `EncodeOptions` with optional `mode?: QRModeOption`.
- `packages/core/src/qr/encoder.ts` [MODIFIED]:
  - **Rationale**: Implemented standard QR multi-mode encoding with auto-detection (`detectQRMode`). Pure numeric strings (0-9) are packed 3 digits into 10 bits, 2 digits into 7 bits, 1 digit into 4 bits. Alphanumeric strings are packed 2 characters into 11 bits ($c_1 \times 45 + c_2$). Byte mode remains 8-bit UTF-8. Updated minimum version selection loop to evaluate exact mode bit counts, producing smaller matrix versions for numeric/alphanumeric payloads.
- `packages/core/src/dna/generator.ts` [MODIFIED]:
  - **Rationale**: Added deterministic `circuit: CircuitDNA` generation via Mulberry32 PRNG seed for reproducible PCB solder mask colors, IC package types, and trace styles.
- `packages/core/tests/core.test.ts` [MODIFIED]:
  - **Rationale**: Added unit test suite for mode auto-detection, numeric packing version reduction, alphanumeric encoding, and CircuitDNA deterministic fields.

### 2. Zero-WebGL Graceful Fallback
- `packages/renderer-webgl/src/fallback/fallback.ts` [NEW]:
  - **Rationale**: Added `isWebGLSupported(): boolean` to safely detect WebGL/WebGL2 availability, and `render2DFallbackCanvas()` to draw high-contrast 2D QR codes with 4-module quiet zone on standard Canvas 2D.
- `packages/renderer-webgl/src/index.ts` [MODIFIED]:
  - **Rationale**: Exported `isWebGLSupported`, `render2DFallbackCanvas`, and `FallbackRenderOptions`.
- `packages/react/src/JiwoQR.tsx` [MODIFIED]:
  - **Rationale**: Added WebGL capability check. If WebGL is unavailable or context creation fails, gracefully falls back to high-contrast 2D Canvas rendering with full reactivity to `value` changes.
- `packages/web-component/src/jiwo-qr.ts` [MODIFIED]:
  - **Rationale**: Added WebGL detection in `connectedCallback`. If WebGL is unsupported, renders 2D canvas fallback inside custom element DOM and updates reactively on attribute changes.

### 3. New Package `@jiwoqr/exporter`
- `packages/exporter/package.json` [NEW]:
  - **Rationale**: Manifest for `@jiwoqr/exporter` package depending on `@jiwoqr/core` and `three`.
- `packages/exporter/tsconfig.json` [NEW]:
  - **Rationale**: TypeScript configuration extending `tsconfig.base.json`.
- `packages/exporter/src/types.ts` [NEW]:
  - **Rationale**: Type interfaces for STL, GLB, SVG, and PNG export configurations.
- `packages/exporter/src/stl.ts` [NEW]:
  - **Rationale**: Binary watertight/manifold `.stl` mesh generator for 3D printing. Extrudes solid base substrate plate ($W \times H \times T_{base}$) and raised QR data module boxes with CCW outward normals and closed planar topology.
- `packages/exporter/src/glb.ts` [NEW]:
  - **Rationale**: Three.js GLTFExporter wrapper converting 3D scenes to binary `.glb` buffers preserving instance geometries, materials, and vertex colors.
- `packages/exporter/src/svg.ts` [NEW]:
  - **Rationale**: Canonical standalone vector SVG generator with quiet zone margin and optional border radii.
- `packages/exporter/src/png.ts` [NEW]:
  - **Rationale**: 300 DPI print-ready high-resolution raster PNG generator with anti-aliasing disabled for crisp binary edges.
- `packages/exporter/src/utils.ts` [NEW]:
  - **Rationale**: Cross-browser file download trigger helper `downloadFile()`.
- `packages/exporter/src/index.ts` [NEW]:
  - **Rationale**: Public entry-point exporting all 3D/2D export methods and download helpers.
- `packages/exporter/tests/exporter.test.ts` [NEW]:
  - **Rationale**: Unit tests verifying binary STL header format, triangle count calculation ($12 + 12 \times \text{darkModules}$), buffer length, SVG markup validity, and GLB binary headers.
- `packages/exporter/README.md` [NEW]:
  - **Rationale**: Complete documentation and quickstart guides for `@jiwoqr/exporter`.

### 4. `@jiwoqr/math` & `@jiwoqr/renderer-webgl` Circuit Model Archetype (`model="circuit"`)
- `packages/math/src/types.ts` [MODIFIED]:
  - **Rationale**: Added `CircuitComponentType` and `CircuitModuleTransform` interfaces.
- `packages/math/src/projections/circuit.ts` [NEW]:
  - **Rationale**: Implemented `computeCircuitModuleTransform` (placing QFP IC packages at finders and SMD resistors/capacitors/via pads/copper traces at data modules) and `interpolateCircuitMorph` (flattening components and collapsing rotations to $0$ as $t \to 1.0$).
- `packages/math/src/index.ts` [MODIFIED]:
  - **Rationale**: Exported circuit projection math and morph helpers.
- `packages/math/tests/math.test.ts` [MODIFIED]:
  - **Rationale**: Added unit tests verifying circuit transform assignment and 3D-to-2D morphing.
- `packages/renderer-webgl/src/types.ts` [MODIFIED]:
  - **Rationale**: Updated `RenderModel = 'architecture' | 'globe' | 'circuit'`.
- `packages/renderer-webgl/src/models/circuit.ts` [NEW]:
  - **Rationale**: Cybernetic PCB / Microchip Core archetype model featuring solder mask base plate, QFP IC microprocessor finders, SMD electronic components (resistors, ceramic capacitors, gold via pads, copper conductor traces), and seamless high-contrast scan mode transition.
- `packages/renderer-webgl/src/scene/camera-controller.ts` [MODIFIED]:
  - **Rationale**: Added `applyGyroTilt(gamma, beta)` method for holographic device orientation camera orbit.
- `packages/renderer-webgl/src/renderer.ts` [MODIFIED]:
  - **Rationale**: Supported `model="circuit"` in `buildModel()`, and exposed `getScene()` and `getCameraController()` methods.
- `packages/renderer-webgl/src/index.ts` [MODIFIED]:
  - **Rationale**: Exported `createCircuitModel` and `CircuitModelInstance`.

### 5. Interactive Studio Demo (`apps/demo`)
- `apps/demo/package.json` [MODIFIED]:
  - **Rationale**: Added `@jiwoqr/exporter` workspace dependency.
- `apps/demo/index.html` [MODIFIED]:
  - **Rationale**: Added Circuit model selector button, Export Toolbar (Export GLB, Export STL, Export PNG, Export SVG), and Gyroscope Tilt toggle button.
- `apps/demo/src/style.css` [MODIFIED]:
  - **Rationale**: Added styles for secondary nav button with glowing active state, 3-column model selector, and export action button grid.
- `apps/demo/src/main.ts` [MODIFIED]:
  - **Rationale**: Attached click handlers for Circuit model selection, wired export buttons to `@jiwoqr/exporter`, integrated mobile `DeviceOrientationEvent` sensor tilt, and updated telemetry readout for Circuit PCB specs.
- `apps/demo/vite.config.ts` [MODIFIED]:
  - **Rationale**: Configured `cacheDir: './.vite'` to isolate pre-bundling cache outside of `node_modules` symlinks, preventing Windows file locking (`EPERM: operation not permitted, rmdir ...`) during development server startup.

### 6. Procedural 3D Skyscraper STL Heights & Circuit Telemetry Fixes
- `packages/core/dist/` [MODIFIED]:
  - **Rationale**: Recompiled all `@jiwoqr/core` artifacts with latest `CircuitDNA` generation in `generateDNA()`.
- `packages/renderer-webgl/src/models/circuit.ts` [MODIFIED]:
  - **Rationale**: Added optional chaining `dna.circuit?.solderMaskColor ?? 'green'` to prevent runtime crashes if `dna.circuit` is undefined.
- `apps/demo/src/main.ts` [MODIFIED]:
  - **Rationale**: Added safe optional chaining in `updateTelemetry()` for `dna.circuit?.chipPackage`, `solderMaskColor`, and `traceStyle`. Updated `btnExportSTL` click handler to pass `entity.dna` and `{ model: renderer.getModel() }` so exported STL meshes reflect the active visual 3D archetype.
- `packages/exporter/src/types.ts` [MODIFIED]:
  - **Rationale**: Added `STLArchetypeModel = 'architecture' | 'globe' | 'circuit' | 'flat'` and updated `STLExportOptions` to include `model` and `maxHeight`.
- `packages/exporter/src/stl.ts` [MODIFIED]:
  - **Rationale**: Enhanced `exportSTL` to dynamically calculate procedural 3D heights using `@jiwoqr/math` (`computeExtrusionTransform` for towering skyscraper landmark finders and city blocks, `computeGlobeModuleTransform` for spherical mound domes, and `computeCircuitModuleTransform` for SMD component packages), ensuring exported 3D `.stl` files look 100% identical to the interactive 3D visual scene.
- `packages/exporter/package.json` [MODIFIED]:
  - **Rationale**: Added `@jiwoqr/math` workspace dependency to support procedural transform computations.
- `packages/exporter/tests/exporter.test.ts` [MODIFIED]:
  - **Rationale**: Added unit tests verifying procedural architecture skyscraper heights and circuit heights in exported STL files.

### 7. Comprehensive Ecosystem Documentation Suite Update (Phase 2)
- `README.md` [MODIFIED]:
  - **Rationale**: Updated root documentation to feature 3 visual models (Architecture, Globe, Circuit), `@jiwoqr/exporter` 3D/2D export capabilities, multi-mode bitstream compression, zero-WebGL fallback, and holographic gyroscope tilt.
- `packages/core/README.md` [MODIFIED]:
  - **Rationale**: Documented multi-mode encoding (`numeric`, `alphanumeric`, `byte`, `auto`) and `CircuitDNA` configuration interfaces.
- `packages/math/README.md` [MODIFIED]:
  - **Rationale**: Documented `src/projections/circuit.ts` and `CircuitModuleTransform` mathematical mapping.
- `packages/renderer-webgl/README.md` [MODIFIED]:
  - **Rationale**: Documented `model="circuit"`, zero-WebGL graceful 2D canvas fallback (`render2DFallbackCanvas`), and `applyGyroTilt` mobile sensor integration.
- `packages/exporter/README.md` [MODIFIED]:
  - **Rationale**: Updated with complete technical Indonesian documentation for binary watertight STL generation with procedural 3D model heights, Three.js GLB binary scene export, 300 DPI PNG, and SVG vectors.
- `packages/react/README.md` [MODIFIED]:
  - **Rationale**: Documented `model="circuit"` and automatic 2D Canvas fallback when WebGL context is unavailable.
- `packages/web-component/README.md` [MODIFIED]:
  - **Rationale**: Documented `model="circuit"` and zero-WebGL fallback.
- `apps/demo/README.md` [MODIFIED]:
  - **Rationale**: Documented Circuit model selector, Export toolbar (GLB, STL, PNG, SVG), Gyroscope tilt mode, and Circuit PCB telemetry.
- `Report-To-GeminiProject.md` [MODIFIED]:
  - **Rationale**: Consolidated full Phase 1 & Phase 2 project report detailing all mathematical foundations, 3D printing engine, 3 visual models, WebGL fallback, test suite verification, and GitHub synchronization.
- `.gitignore` [MODIFIED]:
  - **Rationale**: Added `.vite/` and `*.vite` to prevent pre-bundler cache files from being tracked.





