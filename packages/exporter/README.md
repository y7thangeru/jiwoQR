# 🖨️ @jiwoqr/exporter

> **Mesin Ekspor Mesh 3D Cetak & Raster/Vektor Cetak Resolusi Tinggi**  
> *Generator berkas biner STL watertight/manifold untuk 3D printing dengan elevasi prosedural sesuai model 3D aktif, konverter Three.js ke GLB biner, serta eksportir SVG vektor & PNG 300 DPI ultra-tajam.*

[![Package: @jiwoqr/exporter](https://img.shields.io/badge/Package-%40jiwoqr%2Fexporter-blue.svg)](file:///d:/REPOS/jiwoQR/packages/exporter)
[![3D Print Ready](https://img.shields.io/badge/3D%20Print-Binary%20STL%20Watertight-brightgreen.svg)](file:///d:/REPOS/jiwoQR/packages/exporter)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/exporter/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Modul](#-arsitektur-modul)
- [Panduan Ekspor Berkas](#-panduan-ekspor-berkas)
  - [1. Ekspor 3D Print Watertight STL (`exportSTL`)](#1-ekspor-3d-print-watertight-stl-exportstl)
  - [2. Ekspor 3D Scene Binary GLB (`exportGLB`)](#2-ekspor-3d-scene-binary-glb-exportglb)
  - [3. Ekspor Vektor SVG Mandiri (`exportSVG`)](#3-ekspor-vektor-svg-mandiri-exportsvg)
  - [4. Ekspor Raster 300 DPI PNG (`exportPNG`)](#4-ekspor-raster-300-dpi-png-exportpng)
  - [5. Helper Download Otomatis (`downloadFile`)](#5-helper-download-otomatis-downloadfile)
- [Struktur Tipe Data & Interface](#-struktur-tipe-data--interface)
- [Pengujian Unit](#-pengujian-unit)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/exporter` menjembatani dunia virtual 3D JiwoQR dengan manufaktur fisik (3D printing, laser cutting, sablon kartu nama) dan integrasi aset digital 3D game/animasi.

Setiap berkas mesh `.stl` yang dihasilkan dihitung secara presisi dengan topologi tertutup (*closed manifold geometry*) dengan normal segitiga menghadap ke luar (*Counter-Clockwise/CCW winding order*), sehingga siap dimasukkan langsung ke software *slicer* (Cura, PrusaSlicer, Bambu Studio, OrcaSlicer) tanpa error *non-manifold edge*.

---

## ✨ Fitur Utama

- **Watertight Solid Binary STL**: Menghasilkan pelat substrate dasar padu ($W \times H \times T_{\text{base}}$) dan balok modul data timbul. Elevasi balok dapat mengikuti arketipe 3D aktif (`architecture` pencakar langit bertingkat, `globe` kubah bola, `circuit` chip SMD, `biomorphic` pilar kristal, `city` blok kota metropolitan bertingkat, `origami` prisma polihedral lipatan kertas miring, atau `flat` standar).
- **Native AR Quick Look (iOS) & Scene Viewer (Android)**: Mengekspor scene Three.js aktif ke blob USDZ biner untuk memicu AR Quick Look asli pada iOS Safari, atau menyusun intent URL Google Scene Viewer untuk preview AR instan pada Chrome Android.
- **Three.js Binary GLB**: Mengonversi `THREE.Scene` aktif ke file `.glb` biner dengan mempertahankan material PBR, instance mesh, dan warna vertex.
- **300 DPI Print-Ready PNG**: Merender QR code kanonikal beresolusi ultra-tinggi ($2048\times2048+$) dengan anti-aliasing dinonaktifkan untuk mencegah pendaran piksel buram pada kemasan fisik.
- **Vektor SVG Skalabel**: Format SVG mandiri dengan batas 4 modul quiet zone dan opsi radius sudut (*rounded corners*).
- **Cross-Browser Downloader**: Fungsi `downloadFile()` untuk memicu unduhan file instan di peramban.

---

## 🏗️ Arsitektur Modul

```
packages/exporter/src/
├── stl.ts                     # Binary watertight STL generator (Architecture, City, Origami, Flat)
├── glb.ts                     # Three.js GLTFExporter wrapper untuk GLB binary
├── usdz.ts                    # USDZ exporter, iOS AR Quick Look & Android Scene Viewer intent
├── svg.ts                     # Standalone SVG vector generator
├── png.ts                     # 300 DPI high-res canvas-to-blob raster generator
├── utils.ts                   # downloadFile() blob URL browser helper
├── types.ts                   # Interface opsi ekspor (STLExportOptions, ARLaunchOptions, dsb.)
└── index.ts                   # Ekspor publik
```

---

## 💻 Panduan Ekspor Berkas

### 1. Ekspor 3D Print Watertight STL (`exportSTL`)

```typescript
import { createJiwoQR } from '@jiwoqr/core';
import { exportSTL, downloadFile } from '@jiwoqr/exporter';

const entity = createJiwoQR('https://jiwoqr.dev');

// Menghasilkan buffer STL dengan elevasi kertas origami bersudut
const stlBuffer = exportSTL(entity.matrix, entity.dna, {
  model: 'origami',     // 'architecture' | 'globe' | 'circuit' | 'biomorphic' | 'city' | 'origami' | 'flat'
  moduleSize: 2.0,      // 2mm per modul
  baseThickness: 2.0,   // 2mm pelat dasar
  maxHeight: 6.0,       // Ketinggian puncak mahkota lipatan
});

downloadFile(stlBuffer, 'jiwo-qr-origami-3dprint.stl', 'application/sla');
```

---

### 2. Ekspor 3D Scene Binary GLB (`exportGLB`)

```typescript
import { JiwoWebGLRenderer } from '@jiwoqr/renderer-webgl';
import { exportGLB, downloadFile } from '@jiwoqr/exporter';

const renderer = new JiwoWebGLRenderer({ container, model: 'globe' });
renderer.setData('https://jiwoqr.dev');

// Ekspor scene 3D aktif
const glbBuffer = await exportGLB(renderer.getScene(), { binary: true });
downloadFile(glbBuffer, 'jiwo-globe-scene.glb', 'model/gltf-binary');
```

---

### 3. Instant Mobile AR Preview (`launchARView` & `generateUSDZBlob`)

```typescript
import { launchARView, generateUSDZBlob, detectARCapabilities } from '@jiwoqr/exporter';

// Deteksi kemampuan AR perangkat
const { isIOS, isAndroid, isARAvailable } = detectARCapabilities();

// Memicu AR Quick Look di iOS Safari atau Google Scene Viewer di Android
await launchARView({
  scene: renderer.getScene(),
  modelName: renderer.getModel(),
  title: 'JiwoQR 3D Holographic Model',
});
```

---

### 4. Ekspor Vektor SVG Mandiri (`exportSVG`)

```typescript
import { encodeQR } from '@jiwoqr/core';
import { exportSVG, downloadFile } from '@jiwoqr/exporter';

const matrix = encodeQR('https://jiwoqr.dev');
const svgString = exportSVG(matrix, {
  size: 512,
  darkColor: '#000000',
  lightColor: '#ffffff',
  borderRadius: 0.1, // modul agak membulat
});

downloadFile(svgString, 'jiwo-qr.svg', 'image/svg+xml');
```

---

### 5. Ekspor Raster 300 DPI PNG (`exportPNG`)

```typescript
import { encodeQR } from '@jiwoqr/core';
import { exportPNG, downloadFile } from '@jiwoqr/exporter';

const matrix = encodeQR('https://jiwoqr.dev');
const pngBlob = await exportPNG(matrix, {
  size: 2048,          // Resolusi 2048x2048 piksel
  darkColor: '#000000',
  lightColor: '#ffffff',
});

downloadFile(pngBlob, 'jiwo-qr-300dpi.png', 'image/png');
```

---

## 📐 Struktur Tipe Data & Interface

```typescript
export type STLArchetypeModel =
  | 'architecture'
  | 'globe'
  | 'circuit'
  | 'biomorphic'
  | 'city'
  | 'origami'
  | 'flat';

export interface STLExportOptions {
  model?: STLArchetypeModel;
  moduleSize?: number;     // Ukuran fisik modul (mm) - default: 2.0
  baseThickness?: number;  // Ketebalan pelat dasar (mm) - default: 2.0
  moduleHeight?: number;   // Ketinggian timbul modul (mm) - default: 2.0
  maxHeight?: number;      // Ketinggian fitur tertinggi 3D (mm)
  padding?: number;
}

export interface USDZExportOptions {
  animations?: THREE.AnimationClip[];
  maxTextureSize?: number;
}

export interface ARCapabilities {
  isIOS: boolean;
  isAndroid: boolean;
  isARAvailable: boolean;
}

export interface ARLaunchOptions {
  scene: THREE.Object3D | THREE.Scene;
  glbUrl?: string;
  modelName?: string;
  title?: string;
}

export interface GLBExportOptions {
  binary?: boolean;
  animations?: THREE.AnimationClip[];
  onlyVisible?: boolean;
}
```

---

## 🧪 Pengujian Unit

```bash
pnpm test
```
Verifikasi unit test memeriksa kebenaran header 80-byte STL biner, perhitungan jumlah segitiga, manifold watertightness model Origami, format intent Google Scene Viewer, dan deteksi kapabilitas mobile AR.
