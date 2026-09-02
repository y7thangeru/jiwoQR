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
  - [4. Model Biomorphic Crystalline (`src/models/biomorphic.ts`)](#4-model-biomorphic-crystalline-srcmodelsbiomorphicts)
- [GPU Vertex Shader Morphing Pipeline (`src/shaders/gpu-morph.ts`)](#-gpu-vertex-shader-morphing-pipeline-srcshadersgpu-morphts)
- [Sistem Kamera, Orbit & Giroskop Mobile (iOS Safari Compatible)](#-sistem-kamera-orbit--giroskop-mobile-ios-safari-compatible)
- [Sistem Mitigasi Pencahayaan & Bayangan untuk Pemindaian Optik](#-sistem-mitigasi-pencahayaan--bayangan-untuk-pemindaian-optik)
- [Zero-WebGL Graceful Fallback (`src/fallback/`)](#-zero-webgl-graceful-fallback-srcfallback)
- [Optimasi Performa Rendering](#-optimasi-performa-rendering)
- [Contoh Kode Integrasi](#-contoh-kode-integrasi)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/renderer-webgl` bertanggung jawab mengubah struktur semantik data QR dari `@jiwoqr/core` dan kalkulasi spasial dari `@jiwoqr/math` menjadi pemandangan 3D interaktif yang menakjubkan menggunakan **Three.js**.

Keunggulan utama:
- **GPU-Accelerated 120 FPS Vertex Shader Morphing**: Melakukan kalkulasi interpolasi morphing $3\text{D} \to 2\text{D}$ langsung di GPU Vertex Shader melalui uniform `uMorphProgress` dan instanced buffer attributes (`aPosition3D`, `aPosition2D`, `aScale3D`, `aScale2D`, `aRotationZ3D`, `aColor3D`, `aColor2D`), menghilangkan beban loop per-modul di CPU.
- **Empat Arketipe Visual**: Architecture (kota brutalist), Globe (kubah bola voxel mound), Circuit (papan PCB microchip), dan Biomorphic (pertumbuhan kristal mineral heksagonal).
- **iOS 13+ Safari Gyroscope Permission**: Utilitas asynchronous terstandar untuk otorisasi sensor gerak pada perangkat Apple dan Android.
- **Graceful Fallback**: Deteksi otomatis kapabilitas WebGL dengan fallback mulus ke Canvas 2D murni.

---

## 🏗️ Arsitektur Modul

```
packages/renderer-webgl/src/
├── fallback/
│   └── fallback.ts            # Deteksi WebGL & canvas 2D fallback renderer
├── shaders/
│   └── gpu-morph.ts           # Hook shader Three.js untuk interpolasi posisi, rotasi, & warna di GPU
├── models/
│   ├── architecture.ts        # Model 1: Kota skyscraper cyber-brutalist & menara finder
│   ├── globe.ts               # Model 2: Dual-hemisphere voxel mound dome & gradien elevasi
│   ├── circuit.ts             # Model 3: PCB board, chip QFP, SMD components, via & traces
│   ├── biomorphic.ts          # Model 4: Kristal mineral heksagonal, geode bercahaya & refraksi PBR
│   ├── city.ts                # Model 5: Kota metropolitan realistis (multi-STL instances, street-facing)
│   └── building-manager.ts    # Asset loader & normalizer model STL 3D dinamis
├── scene/
│   └── camera-controller.ts   # Orbit drag 3D, sensor giroskop iOS/Android, & auto-alignment
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
- Menampilkan motherboard PCB lengkap dengan lapisan solder mask (hijau, hitam, biru, ungu).
- Tiga pola finder dirender sebagai chip mikroprosesor IC QFP dengan pin logam.
- Modul data dirender sebagai komponen SMD (resistor, kapasitor, gold via pads, dan copper traces).
- Seluruh komponen melebur rata menjadi modul biner 2D hitam pekat di atas pelat putih saat beralih ke Mode Scan.

### 4. Model Biomorphic Crystalline (`src/models/biomorphic.ts`)
- **Tema:** *Crystalline Mineral & Coral Growth*.
- Modul QR dirender sebagai prisma kristal heksagonal (`CylinderGeometry(0.46, 0.54, 1.0, 6)`) dengan orientasi facet dan kemiringan deterministik.
- Pola Finder dimodelkan sebagai klaster kristal geodesik monolitik besar bercahaya tinggi.
- Material menggunakan `MeshPhysicalMaterial` dengan sifat translusen/refraktif (`transmission: 0.35`, `ior: 1.55`, `clearcoat: 0.75`).
- Saat beralih ke Mode Scan ($t \to 1.0$), kristal memadat dan permukaannya merata menjadi modul hitam-putih kanonikal.

### 5. Model Kota Realistis Metropolitan (`src/models/city.ts` & `src/models/building-manager.ts`)
- **Tema:** *Realistic 3D Metropolis City Grid with Dynamic Custom STL Building Models*.
- **Dynamic Asset Auto-Discovery (`BuildingModelManager`)**: Memuat semua model `.stl` dari `STL-for-buildingModels/` secara asinkronus, menormalisasi titik pusat $(0,0)$ dan fondasi dasar pada $Z = 0$, serta mengatur ukuran horizontal menjadi $0.92$ unit untuk ruang gang (*alleyways*) yang rapih.
- **IndexedDB Asset Cache**: Menyimpan geometri STL yang telah dinormalisasi dan didesimasi ke dalam browser `IndexedDB`. Jika model gedung pernah diunduh sebelumnya, muat instan langsung dari IndexedDB ($< 50\text{ ms}$).
- **Street-Facing Orientation**: Menganalisa 4 tetangga ortogonal setiap sel untuk memutar orientasi bangunan ($0^\circ, 90^\circ, 180^\circ, 270^\circ$) agar selalu menghadap ke jalan raya terbuka.
- **Cellular Block Zoning & CBD Gradient**: Pengelompokan lot bangunan dalam distrik harmonis dengan pencakar langit terkonsentrasi di pusat kota (*Central Business District*) dan menara monumental di 3 sudut Finder.
- **Multi-Geometry Instanced Rendering**: Menggunakan `THREE.InstancedMesh` per model STL unik dengan `DynamicDrawUsage` untuk rendering GPU 60+ FPS.

### 6. Model Origami Fold (`src/models/origami.ts`)

- **Tema:** *Geometric Folded Paper / Low-Poly Origami Polyhedron*.
- **Visual:** Modul data gelap dirender sebagai prisma polihedral lipatan kertas miring dengan pencahayaan faset tajam (*flat shading*) dan tekstur serat kertas (*washi/parchment*).
- **Struktur Finder Patterns:** Tiga Finder Patterns dirender sebagai struktur mahkota derek geometris (*origami crane crowns*) bertingkat dengan sayap terlipat bersudut.
- **Mekanisme Morphing:** Saat $t \to 1.0$, lipatan kertas membuka (*unfolds*) secara mekanis di GPU shader dan faset-faset segitiga merata menjadi bidang 2D hitam solid.

---

## ⚡ GPU Vertex Shader Morphing Pipeline (`src/shaders/gpu-morph.ts`)

Pada Fase 3, seluruh interpolasi spasial dan warna modul dipindahkan dari CPU ke **GPU Vertex Shader**:
1. **Instanced Buffer Attributes**: Posisi target 3D ($x_1, y_1, z_1$) dan 2D ($x_0, y_0, z_0$), skala 3D/2D, sudut rotasi Z, dan warna 3D disimpan langsung dalam VBO GPU:
   - `aPosition3D`, `aPosition2D`
   - `aScale3D`, `aScale2D`
   - `aRotationZ3D`
   - `aColor3D`, `aColor2D`
2. **Zero-Looping CPU Execution**: Pada setiap frame (`requestAnimationFrame`), CPU hanya memperbarui nilai uniform:
   ```typescript
   morphUniforms.uMorphProgress.value = morphProgress;
   ```
3. **Hasil Efisiensi**: Penggunaan CPU per frame turun dari $\sim 3\text{ ms}$ menjadi $< 0.01\text{ ms}$, mempertahankan framerate stabil **120 FPS / 144 FPS** pada layar ProMotion dan perangkat mobile.

---

## 🎥 Sistem Kamera, Orbit & Giroskop Mobile (iOS Safari Compatible)

- **Orbit Mouse/Touch**: Rotasi bebas dengan redaman inersia $0.05$.
- **iOS 13+ Safari Permission Handling**:
  ```typescript
  import { requestDeviceOrientationPermission } from '@jiwoqr/renderer-webgl';

  btnGyro.addEventListener('click', async () => {
    const granted = await requestDeviceOrientationPermission();
    if (granted) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          renderer.getCameraController().applyGyroTilt(e.gamma, e.beta);
        }
      });
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
