# 🎨 @jiwoqr/renderer-webgl

> **Engine Visualisasi 3D WebGL / Three.js Kinerja Tinggi**  
> *Instanced rendering 60 FPS, arketipe visual Arsitektur, Globe & Circuit PCB, kontrol kamera orbit & sensor giroskop, sistem mitigasi pencahayaan & bayangan, serta graceful fallback ke 2D Canvas.*

[![Package: @jiwoqr/renderer-webgl](https://img.shields.io/badge/Package-%40jiwoqr%2Frenderer--webgl-blue.svg)](file:///d:/REPOS/jiwoQR/packages/renderer-webgl)
[![Three.js](https://img.shields.io/badge/Three.js-r174-black.svg?logo=three.js)](https://threejs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/renderer-webgl/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Modul](#-arsitektur-modul)
- [Kelas Utama: `JiwoWebGLRenderer`](#-kelas-utama-jiwowebglrenderer)
  - [Konfigurasi & Inisialisasi](#konfigurasi--inisialisasi)
  - [Metode & Siklus Hidup (Lifecycle)](#metode--siklus-hidup-lifecycle)
- [Model Visual 3D](#-model-visual-3d)
  - [1. Model Arsitektur (`src/models/architecture.ts`)](#1-model-arsitektur-srcmodelsarchitecturets)
  - [2. Model Bola Voxel (`src/models/globe.ts`)](#2-model-bola-voxel-srcmodelsglobets)
  - [3. Model Sirkuit Elektronik (`src/models/circuit.ts`)](#3-model-sirkuit-elektronik-srcmodelscircuitts)
- [Sistem Kamera, Orbit & Giroskop Mobile](#-sistem-kamera-orbit--giroskop-mobile)
- [Sistem Mitigasi Pencahayaan & Bayangan untuk Pemindaian Optik](#-sistem-mitigasi-pencahayaan--bayangan-untuk-pemindaian-optik)
- [Zero-WebGL Graceful Fallback (`src/fallback/`)](#-zero-webgl-graceful-fallback-srcfallback)
- [Optimasi Performa Rendering](#-optimasi-performa-rendering)
- [Contoh Kode Integrasi](#-contoh-kode-integrasi)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/renderer-webgl` bertanggung jawab mengubah struktur semantik data QR dari `@jiwoqr/core` dan kalkulasi spasial dari `@jiwoqr/math` menjadi pemandangan 3D interaktif yang menakjubkan menggunakan **Three.js**.

Keunggulan utama:
- **Zero Jitter 60 FPS Morphing**: Memanfaatkan `THREE.InstancedMesh` dengan atribut buffer `DynamicDrawUsage` sehingga pembaruan ribuan matriks posisi modul dalam satu frame dieksekusi tanpa overhead alokasi memori.
- **Tiga Arketipe Visual**: Architecture (kota brutalist), Globe (kubah bola voxel mound), dan Circuit (papan PCB microchip).
- **Graceful Fallback**: Deteksi otomatis kapabilitas WebGL dengan fallback mulus ke Canvas 2D murni.

---

## 🏗️ Arsitektur Modul

```
packages/renderer-webgl/src/
├── fallback/
│   └── fallback.ts            # Deteksi WebGL & canvas 2D fallback renderer
├── models/
│   ├── architecture.ts        # Model kota skyscraper cyber-brutalist & menara finder
│   ├── globe.ts               # Model dual-hemisphere voxel mound dome & gradien elevasi
│   └── circuit.ts             # Model PCB board, chip QFP, SMD components, via & traces
├── scene/
│   └── camera-controller.ts   # Orbit drag 3D, sensor giroskop tilt, & auto-alignment
├── types.ts                   # Interface opsi renderer & model types
├── renderer.ts                # Kelas utama JiwoWebGLRenderer & render loop
└── index.ts                   # Ekspor publik
```

---

## 🚀 Kelas Utama: `JiwoWebGLRenderer`

### Konfigurasi & Inisialisasi

```typescript
import { JiwoWebGLRenderer, JiwoRendererOptions } from '@jiwoqr/renderer-webgl';

const renderer = new JiwoWebGLRenderer({
  container: document.getElementById('canvas-container')!,
  model: 'circuit',     // 'architecture' | 'globe' | 'circuit'
  mode: '3d',           // '3d' | 'scan'
  morphDuration: 800,   // Durasi animasi perpindahan mode (ms)
  antialias: true,
});
```

### Metode & Siklus Hidup (Lifecycle)

| Metode | Deskripsi |
| :--- | :--- |
| `setData(payload: string)` | Menghitung DNA & matriks QR baru dari string/URL, lalu membangun ulang model 3D secara reaktif. |
| `setEntity(entity: JiwoQREntity)` | Memuat entitas `JiwoQREntity` yang sudah dihitung sebelumnya. |
| `setModel(model: RenderModel)` | Mengganti arketipe visual (`'architecture'`, `'globe'`, `'circuit'`). |
| `getModel(): RenderModel` | Mengambil arketipe model yang sedang aktif. |
| `setMode(mode: RenderMode)` | Memulai animasi transisi mulus antara `'3d'` dan `'scan'` mode. |
| `getMode(): RenderMode` | Mengambil mode yang sedang aktif (`'3d'` atau `'scan'`). |
| `setMorphProgress(progress: number)` | Mengatur progress morphing secara manual ($0.0 = 3\text{D}$, $1.0 = \text{Scan}$). |
| `getMorphProgress(): number` | Mengambil nilai progress morphing saat ini. |
| `getScene(): THREE.Scene` | Mengambil referensi THREE.Scene aktif (berguna untuk eksportir GLB). |
| `getCameraController(): CameraController` | Mengambil instance pengontrol kamera. |
| `resize(width: number, height: number)` | Menyesuaikan rasio aspek kamera dan ukuran viewport WebGL. |
| `dispose()` | Menghentikan render loop, memutuskan ResizeObserver, menghapus event listener, dan membersihkan memori GPU. |

---

## 🏛️ Model Visual 3D

### 1. Model Arsitektur (`src/models/architecture.ts`)
- Membentuk kota bertingkat dari blok-blok instanced box (`BoxGeometry(1, 1, 1)`).
- Menara Finder diekstrusi hingga $1.75\times$ tinggi maksimum dengan warna pendaran emisif khusus (`finderEmissive`).
- Dilengkapi pelat dasar (*ground substrate plate*) yang menutupi area matriks QR beserta zona tenang 4 modul.

### 2. Model Bola Voxel (`src/models/globe.ts`)
- Membentuk gundukan voxel 3D dual-hemisfer (Kubah A di $+Z$ dan Kubah B di $-Z$).
- Gradasi warna kontinental dari terracotta di ekuator ke biru/ungu di tengah dan emas di puncak.
- Pelat ekuator $Z = 0$ disembunyikan di mode 3D agar bola tampak melayang utuh, dan memudar masuk saat bertransisi ke Mode Scan.

### 3. Model Sirkuit Elektronik (`src/models/circuit.ts`)
- Menampilkan motherboard PCB lengkap dengan lapisan solder mask (hijau, hitam, biru, merah).
- Tiga pola finder dirender sebagai chip mikroprosesor IC QFP dengan pin logam.
- Modul data dirender sebagai komponen SMD (resistor, kapasitor, gold via pads, dan copper traces).
- Seluruh komponen melebur rata menjadi modul biner 2D hitam pekat di atas pelat putih saat beralih ke Mode Scan.

---

## 🎥 Sistem Kamera, Orbit & Giroskop Mobile

- **Orbit Mouse/Touch**: Rotasi bebas dengan redaman inersia $0.05$.
- **Holographic Gyroscope Tilt (`applyGyroTilt`)**:
  ```typescript
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null && e.beta !== null) {
      renderer.getCameraController().applyGyroTilt(e.gamma, e.beta);
    }
  });
  ```
- **Auto-Alignment Scan Mode**: Kamera otomatis berpindah tegak lurus ke posisi $(0, 0, Z)$ tepat menghadap QR.

---

## 💡 Sistem Mitigasi Pencahayaan & Bayangan untuk Pemindaian Optik

Saat bertransisi ke Mode Scan ($t > 0.85$):
- Bayangan directional dinonaktifkan (`castShadow = false`).
- Ambient light dinaikkan menjadi $1.0\times$.
- Material dialihkan dari PBR glossy menjadi matte diffuse murni.

---

## 🛡️ Zero-WebGL Graceful Fallback (`src/fallback/`)

Menyediakan fungsi utility untuk browser tanpa WebGL:

```typescript
import { isWebGLSupported, render2DFallbackCanvas } from '@jiwoqr/renderer-webgl';

if (!isWebGLSupported()) {
  const canvas = document.createElement('canvas');
  render2DFallbackCanvas(canvas, matrix, {
    size: 400,
    darkColor: '#000000',
    lightColor: '#ffffff',
  });
  container.appendChild(canvas);
}
```

---

## 💻 Contoh Kode Integrasi

```typescript
import { JiwoWebGLRenderer } from '@jiwoqr/renderer-webgl';

const renderer = new JiwoWebGLRenderer({
  container: document.getElementById('app')!,
  model: 'circuit',
  mode: '3d',
});

renderer.setData('https://jiwoqr.dev');
```
