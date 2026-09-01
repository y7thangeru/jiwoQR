# 🎨 @jiwoqr/renderer-webgl

> **Engine Visualisasi 3D WebGL / Three.js Kinerja Tinggi**  
> *Instanced rendering 60 FPS, arketipe visual Arsitektur & Globe Voxel Mound, kontrol kamera orbit halus, serta sistem mitigasi pencahayaan & bayangan cerdas untuk jaminan pemindaian barcode 100%.*

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
- [Sistem Kamera & Kontrol Orbit (`src/scene/camera-controller.ts`)](#-sistem-kamera--kontrol-orbit-srcscenecamera-controllerts)
- [Sistem Mitigasi Pencahayaan & Bayangan untuk Pemindaian Optik](#-sistem-mitigasi-pencahayaan--bayangan-untuk-pemindaian-optik)
- [Optimasi Performa Rendering](#-optimasi-performa-rendering)
- [Contoh Kode Integrasi](#-contoh-kode-integrasi)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/renderer-webgl` bertanggung jawab mengubah struktur semantik data QR dari `@jiwoqr/core` dan kalkulasi spasial dari `@jiwoqr/math` menjadi pemandangan 3D interaktif yang menakjubkan menggunakan **Three.js**.

Keunggulan utama:
- **Zero Jitter 60 FPS Morphing**: Memanfaatkan `THREE.InstancedMesh` dengan atribut buffer `DynamicDrawUsage` sehingga pembaruan ribuan matriks posisi modul dalam satu frame dieksekusi tanpa overhead alokasi memori.
- **Transisi Dual-Mode**: Berpindah mulus antara mode 3D eksploratif (*orbit drag, cyber lighting, perspective depth*) dan mode Scan 2D (*perpendicular camera, flat modules, pure binary contrast*).

---

## 🏗️ Arsitektur Modul

```
packages/renderer-webgl/src/
├── models/
│   ├── architecture.ts        # Model kota skyscraper cyber-brutalist & menara finder
│   └── globe.ts               # Model dual-hemisphere voxel mound dome & gradien elevasi
├── scene/
│   └── camera-controller.ts   # Orbit drag 3D, pembatas zoom, & auto-alignment scan mode
├── types.ts                   # Interface opsi renderer & mode types
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
  model: 'architecture', // 'architecture' | 'globe'
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
| `setModel(model: RenderModel)` | Mengganti arketipe visual antara `'architecture'` dan `'globe'`. |
| `getModel(): RenderModel` | Mengambil arketipe model yang sedang aktif. |
| `setMode(mode: RenderMode)` | Memulai animasi transisi mulus antara `'3d'` dan `'scan'` mode. |
| `getMode(): RenderMode` | Mengambil mode yang sedang aktif (`'3d'` atau `'scan'`). |
| `setMorphProgress(progress: number)` | Mengatur progress morphing secara manual ($0.0 = 3\text{D}$, $1.0 = \text{Scan}$). |
| `getMorphProgress(): number` | Mengambil nilai progress morphing saat ini. |
| `resize(width: number, height: number)` | Menyesuaikan rasio aspek kamera dan ukuran viewport WebGL. |
| `dispose()` | Menghentikan render loop, memutuskan ResizeObserver, menghapus event listener, dan membersihkan memori GPU (geometri & material). |

---

## 🏛️ Model Visual 3D

### 1. Model Arsitektur (`src/models/architecture.ts`)
- Membentuk kota bertingkat dari blok-blok instanced box (`BoxGeometry(1, 1, 1)`).
- Menara Finder diekstrusi hingga $1.75\times$ tinggi maksimum dengan warna pendaran emisif khusus (`finderEmissive`).
- Dilengkapi pelat dasar (*ground substrate plate*) yang menutupi area matriks QR beserta zona tenang 4 modul. Saat $t \to 1.0$, warna pelat diinterpolasi dari palet gelap menjadi putih murni (`#ffffff`).

### 2. Model Bola Voxel (`src/models/globe.ts`)
- Membentuk gundukan voxel 3D dual-hemisfer:
  - **Top Mound A**: Menempel di bidang ekuator $Z = 0$ dan diekstrusi ke $+Z$.
  - **Bottom Mound B**: Menempel di bidang ekuator $Z = 0$ dan diekstrusi ke $-Z$.
- **Gradien Warna Elevasi**: Modul di dekat ekuator menggunakan warna substrate/terracotta, elevasi tengah menggunakan palet biru/ungu sekunder, dan puncak kubah menggunakan aksen emas/krem.
- **Bidang Ekuator Tersembunyi di 3D**: Pelat ekuator $Z = 0$ sepenuhnya disembunyikan di mode 3D (`opacity = 0`, `visible = false`) agar bola voxel tampak melayang tanpa terbelah pelat. Pelat putih memudar masuk secara mulus hanya saat bertransisi ke Mode Scan.

---

## 🎥 Sistem Kamera & Kontrol Orbit (`src/scene/camera-controller.ts`)

- **Mode 3D (`t = 0`)**:
  - Mengizinkan rotasi orbit bebas melalui drag mouse atau sentuhan jari.
  - Membatasi sudut polar vertikal agar kamera tidak terbalik.
  - Menerapkan perlambatan inersia (*damping factor* $0.05$).
- **Mode Scan (`t \to 1.0`)**:
  - Menginterpolasi posisi kamera secara otomatis ke koordinat tegak lurus $(0, 0, \text{optimalDistance})$ yang menghadap tepat ke pusat matriks QR.
  - Mengunci rotasi sehingga matriks QR sejajar sempurna dengan layar kamera smartphone.

---

## 💡 Sistem Mitigasi Pencahayaan & Bayangan untuk Pemindaian Optik

Untuk memastikan kamera smartphone dapat membaca barcode secara instan tanpa kendala pantulan cahaya atau bayangan miring gedung:

```typescript
// Saat bertransisi ke mode scan (t > 0.85):
this.directionalLight.castShadow = t < 0.85;
this.directionalLight.intensity = (1.0 - t * 0.7) * 1.8;
this.fillLight.intensity = (1.0 - t) * 0.5;
this.ambientLight.intensity = 0.45 + t * 0.55;

// Material dialihkan dari specular PBR menjadi matte diffuse murni:
moduleMaterial.roughness = 1.0;
moduleMaterial.metalness = 0.0;
```

---

## ⚡ Optimasi Performa Rendering

1. **Instanced Rendering Tunggal**: Seluruh modul QR (hingga ribuan blok) dirender menggunakan satu panggilan `gl.drawElementsInstanced`.
2. **Buffer Dinamis Tanpa Alokasi**: Penggunaan `instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)` memastikan pembaruan matriks posisi tidak memicu garbage collection.
3. **Resize Observer Otomatis**: Secara reaktif menyesuaikan resolusi canvas saat ukuran container DOM berubah tanpa polling.
4. **Pembersihan Memori Lengkap (`dispose`)**: Mencegah memory leak pada Single Page Application (SPA).

---

## 💻 Contoh Kode Integrasi

```typescript
import { JiwoWebGLRenderer } from '@jiwoqr/renderer-webgl';

// 1. Inisialisasi
const renderer = new JiwoWebGLRenderer({
  container: document.getElementById('app')!,
  model: 'globe',
  mode: '3d',
});

// 2. Set payload
renderer.setData('https://github.com/AlbertAZ1992/every-qrcode');

// 3. Kontrol transisi
document.getElementById('toggle-btn')?.addEventListener('click', () => {
  const current = renderer.getMode();
  renderer.setMode(current === '3d' ? 'scan' : '3d');
});
```
