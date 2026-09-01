# 📋 LAPORAN MENYELURUH PROYEK: JiwoQR MONOREPO

> **Dokumen Resmi Laporan Pengembangan & Arsitektur Ekosistem JiwoQR**  
> *Next-Generation Procedural 3D QR Code Ecosystem (Phase 1 & Phase 2 Complete)*

---

## 📌 Identitas & Status Proyek

- **Nama Proyek**: JiwoQR Monorepo
- **Status Repositori**: ✅ Aktif, Terverifikasi & Dipublikasikan ke GitHub
- **URL Repositori GitHub**: [https://github.com/y7thangeru/jiwoQR](https://github.com/y7thangeru/jiwoQR)
- **Branch Utama**: `main`
- **Paket Manajer**: `pnpm@12.2.1` (Workspace Monorepo)
- **Fondasi Teknologi**: TypeScript 5.7 (Strict), Three.js r174, Vitest 3.0, Vite 6.2, Standar ISO/IEC 18004

---

## 📖 Daftar Isi

- [1. Ringkasan Eksekutif & Latar Belakang](#1-ringkasan-eksekutif--latar-belakang)
- [2. Masalah yang Diselesaikan](#2-masalah-yang-diselesaikan)
- [3. Tiga Prinsip & Jaminan Utama (Guarantees)](#3-tiga-prinsip--jaminan-utama-guarantees)
- [4. Arsitektur Monorepo & Peta Dependensi](#4-arsitektur-monorepo--peta-dependensi)
- [5. Rincian Teknis & Rekayasa Per Paket](#5-rincian-teknis--rekayasa-per-paket)
  - [A. @jiwoqr/core (Multi-Mode Bitstream & DNA)](#a-jiwoqrcore-multi-mode-bitstream--dna)
  - [B. @jiwoqr/math (Fondasi Grafika Spasial)](#b-jiwoqrmath-fondasi-grafika-spasial)
  - [C. @jiwoqr/renderer-webgl (Three.js 3D Engine)](#c-jiwoqrrenderer-webgl-threejs-3d-engine)
  - [D. @jiwoqr/exporter (3D Printing & 2D Print Engine)](#d-jiwoqrexporter-3d-printing--2d-print-engine)
  - [E. @jiwoqr/react (Komponen React Deklaratif)](#e-jiwoqrreact-komponen-react-deklaratif)
  - [F. @jiwoqr/web-component (Native Custom Element)](#f-jiwoqrweb-component-native-custom-element)
  - [G. @jiwoqr/renderer-webgpu (Arsitektur Generasi Masa Depan)](#g-jiwoqrrenderer-webgpu-arsitektur-generasi-masa-depan)
  - [H. apps/demo (Interactive 3D Studio Playground)](#h-appsdemo-interactive-3d-studio-playground)
- [6. Tiga Model Visual 3D Unggulan](#6-tiga-model-visual-3d-unggulan)
  - [Model 1: Architecture (Cyber-Brutalist Skyscraper City)](#model-1-architecture-cyber-brutalist-skyscraper-city)
  - [Model 2: Globe (Dual-Hemisphere Voxel Mound Dome)](#model-2-globe-dual-hemisphere-voxel-mound-dome)
  - [Model 3: Circuit (Cybernetic PCB / Microchip Core)](#model-3-circuit-cybernetic-pcb--microchip-core)
- [7. Sistem Mitigasi Pencahayaan & Bayangan Optik](#7-sistem-mitigasi-pencahayaan--bayangan-optik)
- [8. Zero-WebGL Graceful Fallback & Sensor Giroskop](#8-zero-webgl-graceful-fallback--sensor-giroskop)
- [9. Dokumentasi & Integritas Repositori](#9-dokumentasi--integritas-repositori)
- [10. Hasil Verifikasi, Pengujian & Jaminan Mutu](#10-hasil-verifikasi-pengujian--jaminan-mutu)
- [11. Panduan Menjalankan & Mengembangkan](#11-panduan-menjalankan--mengembangkan)

---

## 1. 🌟 Ringkasan Eksekutif & Latar Belakang

**JiwoQR** adalah ekosistem generator QR code 3D prosedural generasi baru yang menjembatani keindahan seni generatif 3D (*procedural 3D generative art*) dengan kepatuhan penuh terhadap standar internasional barcode **ISO/IEC 18004**.

Proyek ini dibangun dari nol (*from scratch*) dengan arsitektur monorepo modern berorientasi performa tinggi, modularitas, interoperabilitas multi-framework (Vanilla WebGL, React, Next.js, Web Components), serta kemampuan manufaktur fisik melalui eksportir STL 3D printing dan cetak 2D beresolusi tinggi.

---

## 2. 🎯 Masalah yang Diselesaikan

Generator QR code artistik konvensional yang beredar saat ini umumnya mengandalkan AI image diffusion (seperti Stable Diffusion dengan ControlNet). Metode tersebut memiliki kelemahan fatal:
1. **Kegagalan Pemindaian (Scan Failure)**: Difusi gambar merusak atau mengaburkan batas modul, pola pencari posisi (*finder patterns*), dan deretan *codeword* koreksi galat (*Reed-Solomon ECC*), menyebabkan QR code seringkali gagal dibaca oleh kamera smartphone.
2. **Ketiadaan Interaktivitas**: Output yang dihasilkan hanya berupa gambar 2D statis tanpa kemampuan eksplorasi 3D real-time.
3. **Non-Deterministik**: Prompt atau seed yang sama seringkali menghasilkan variasi visual yang tidak konsisten antar-render.

**Solusi JiwoQR**: Beroperasi pada level matematika bitstream kanonikal ISO/IEC 18004 dan merendernya secara prosedural ke dalam ruang 3D interaktif Three.js, dengan kemampuan bertransisi (*morphing*) mulus ke mode pemindaian 2D datar berdaya kontras tinggi.

---

## 3. 🛡️ Tiga Prinsip & Jaminan Utama (Guarantees)

1. **100% Deterministic DNA**: Setiap payload/URL unik dipetakan secara matematis menggunakan FNV-1a 64-bit hashing dan Mulberry32 PRNG. Input yang sama akan selalu menghasilkan palet warna, siluet gedung, dan karakteristik visual yang 100% identik.
2. **Zero-Flicker 60 FPS Morphing**: Perpindahan sudut kamera, perataan ketinggian modul ($Z \to 0.02$), dan perubahan warna palet dieksekusi secara instan pada 60 FPS menggunakan Three.js `InstancedMesh` dengan buffer `DynamicDrawUsage`.
3. **Guaranteed Optical Scannability**: Jaminan keterbacaan pemindai smartphone melalui kepatuhan ISO/IEC 18004, kompresi multi-mode, margin zona tenang wajib $\ge 4$ modul, koreksi galat adaptif (L, M, Q, H), mitigasi bayangan dinamis, dan penjajaran kamera tegak lurus (*perpendicular alignment*).

---

## 4. 📦 Arsitektur Monorepo & Peta Dependensi

```
jiwoQR/
├── apps/
│   └── demo/                      # Interactive 3D QR Studio (Vite + TypeScript)
├── packages/
│   ├── core/                      # Multi-mode encoder, Galois Field RS-ECC, DNA generator
│   ├── math/                      # Vektor, easing curves, ekstrusi, spherical & circuit projections
│   ├── renderer-webgl/            # Three.js InstancedMesh engine, models & fallback
│   ├── exporter/                  # 3D mesh (GLB, watertight STL) & 2D print (SVG, PNG 300 DPI)
│   ├── react/                     # Komponen wrapper <JiwoQR /> untuk React & Next.js
│   ├── web-component/             # Native W3C Custom Element <jiwo-qr> (Zero Framework)
│   └── renderer-webgpu/           # Scaffolding & type contracts WebGPU masa depan
├── .gitignore                     # Konfigurasi filter berkas git
├── package.json                   # Root workspace manifest & scripts
├── pnpm-workspace.yaml            # Konfigurasi pnpm workspace
├── tsconfig.base.json             # Konfigurasi TypeScript global
├── README.md                      # Dokumentasi utama monorepo
├── update_tracker.md              # Audit log perubahan berkas & rekayasa teknis
└── Report-To-GeminiProject.md     # Dokumen laporan komprehensif proyek
```

### Diagram Dependensi Antarpaket

```mermaid
graph TD
    apps_demo["apps/demo (Interactive Studio)"]
    pkg_react["@jiwoqr/react"]
    pkg_wc["@jiwoqr/web-component"]
    pkg_exporter["@jiwoqr/exporter"]
    pkg_webgl["@jiwoqr/renderer-webgl"]
    pkg_math["@jiwoqr/math"]
    pkg_core["@jiwoqr/core"]

    apps_demo --> pkg_webgl
    apps_demo --> pkg_core
    apps_demo --> pkg_exporter
    pkg_react --> pkg_webgl
    pkg_react --> pkg_core
    pkg_wc --> pkg_webgl
    pkg_wc --> pkg_core
    pkg_exporter --> pkg_core
    pkg_exporter --> pkg_math
    pkg_webgl --> pkg_core
    pkg_webgl --> pkg_math
    pkg_math -.-> pkg_core
```

---

## 5. 🔬 Rincian Teknis & Rekayasa Per Paket

### A. `@jiwoqr/core` (Multi-Mode Bitstream & DNA)
- **Normalisasi Input (`normalizeInput`)**: Standardisasi skema URL, lowercase hostname, penghapusan port default (`:80`, `:443`), dan pembersihan trailing slash.
- **Hashing FNV-1a 64-bit (`fnv1a64`)**: Menghasilkan *raw hash* `BigInt` 64-bit dengan rumus:
  $$\text{hash} \leftarrow (\text{hash} \oplus c) \times \text{0x100000001b3n} \pmod{2^{64}}$$
- **Mulberry32 PRNG**: Generator bilangan acak semu 32-bit deterministik dengan konversi aman `BigInt.asUintN(32, seed)`.
- **Kompresi Multi-Mode ISO/IEC 18004**:
  - *Numeric Mode*: Memadatkan 3 digit ke 10 bit (mengurangi versi QR secara drastis untuk string angka).
  - *Alphanumeric Mode*: Memadatkan 2 karakter ke 11 bit ($c_1 \times 45 + c_2$).
  - *Byte Mode*: 8-bit UTF-8 untuk teks bebas dan URL.
  - *Auto Mode*: Deteksi otomatis mode terpadat.
- **Generator DNA Visual Prosedural**:
  - *Palet Warna*: Pilihan tema harmonis (*cyber, neon, brutalist, synthwave, obsidian, solar, emerald*).
  - *Arsitektur*: Rentang `maxHeight`, `heightVariance`, `roofStyle`, dan `towerArchetype`.
  - *Globe*: Parameter `continentElevation`, `oceanDepth`, `satelliteCount`, dan `rotationSpeed`.
  - *Circuit*: `traceStyle` (ortho-45, manhattan, curved), `chipPackage` (QFP, BGA), `solderMaskColor` (green, black, blue, red), dan kepadatan via/komponen.
- **Aritmatika Galois Field $\text{GF}(256)$ & Reed-Solomon**: Perhitungan murni eksponensial/logaritma berbasis polinomial primitif $P(x) = x^8 + x^4 + x^3 + x^2 + 1$ (285) dan pembagian polinomial modulo $g(x)$.
- **Enkoder Matriks QR**: Evaluasi penalti 8 pola masking, proteksi format info 15-bit BCH $(15, 5)$, margin 4 modul *Quiet Zone*, dan tag semantik modul.

---

### B. `@jiwoqr/math` (Fondasi Grafika Spasial)
- **Interpolasi & Kurva Easing**:
  - `lerp` & `lerpVec3`: Interpolasi linier vektor 3D.
  - `easeInOutCubic`: Kurva transisi non-linear berakselerasi halus:
    $$f(t) = \begin{cases} 4t^3 & \text{jika } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{jika } t \ge 0.5 \end{cases}$$
- **Ekstrusi Arsitektur (`computeExtrusionTransform`)**:
  - Modul finder diekstrusi menjadi menara landmark ($1.75\times$ tinggi maksimum).
  - Modul data diekstrusi dengan variasi ketinggian deterministik berdasarkan seed.
- **Proyeksi Dual-Hemisphere Voxel Mound Dome (`computeGlobeModuleTransform`)**:
  - Formula profil gundukan kubah bola:
    $$H(x, y) = H_{\text{max}} \times \sqrt{\max\left(0, 1 - \left(\frac{\text{dist}(x, y)}{R_{\text{max}}}\right)^2\right)}$$
- **Proyeksi Sirkuit PCB (`computeCircuitModuleTransform`)**:
  - Menempatkan mikroprosesor IC QFP pada pola finder, resistor/kapasitor SMD, solder via pad emas, dan jalur tembaga pada modul data.

---

### C. `@jiwoqr/renderer-webgl` (Three.js 3D Engine)
- **Instanced Mesh Buffer Dinamis**: Memanfaatkan `THREE.InstancedMesh` dengan `DynamicDrawUsage` untuk matrix transform dan color buffer, memungkinkan pembaruan ribuan modul dalam 1 draw call tanpa garbage collection jank.
- **Tiga Model Visual Terintegrasi**: Architecture, Globe, dan Circuit.
- **Sistem Kamera, Orbit & Giroskop Mobile**:
  - Orbit drag dengan peredaman inersia di mode 3D.
  - Penjajaran tegak lurus otomatis (*perpendicular top-down alignment*) di mode Scan.
  - Integrasi sensor orientasi `DeviceOrientationEvent` (`applyGyroTilt`) untuk efek kedalaman holografik di ponsel.
- **Zero-WebGL Graceful Fallback**: Utilitas `isWebGLSupported()` dan `render2DFallbackCanvas()` untuk rendering 2D Canvas di peramban tanpa WebGL.

---

### D. `@jiwoqr/exporter` (3D Printing & 2D Print Engine)
- **Watertight Solid Binary STL (`exportSTL`)**: Menghasilkan mesh biner `.stl` yang 100% manifold untuk slicer (Cura, PrusaSlicer, Bambu Studio) dengan ketinggian balok prosedural sesuai model 3D aktif.
- **Three.js Binary GLB (`exportGLB`)**: Mengekspor scene 3D aktif lengkap dengan material PBR dan instance geometry.
- **Print-Ready PNG 300 DPI (`exportPNG`)**: Menghasilkan gambar raster tajam ($2048\times2048+$) tanpa anti-aliasing buram untuk percetakan fisik.
- **Vector SVG Mandiri (`exportSVG`)**: Format vektor SVG dengan batas quiet zone dan opsi rounded corners.

---

### E. `@jiwoqr/react` (Komponen React Deklaratif)
- Komponen `<JiwoQR />` untuk React 18, React 19, Next.js, dan Vite.
- Sinkronisasi props reaktif (`value`, `model`, `mode`, `morphDuration`).
- Deteksi WebGL otomatis dengan fallback mulus ke Canvas 2D.
- Panduan integrasi SSR-safe dynamic import untuk Next.js App Router dan Pages Router.

---

### F. `@jiwoqr/web-component` (Native Custom Element)
- Custom Element native `<jiwo-qr>` sesuai standar W3C.
- Digunakan langsung di HTML murni tanpa framework, serta kompatibel dengan Vue 3, Svelte, Angular, SolidJS, dan Astro.
- Fallback otomatis ke 2D Canvas jika WebGL tidak didukung.

---

### G. `@jiwoqr/renderer-webgpu` (Arsitektur Generasi Masa Depan)
- Scaffolding kontrak interface dan pipeline WebGPU.
- Helper deteksi kapabilitas peramban: `isWebGPUSupported()`.
- Roadmap implementasi WGSL compute shader untuk simulasi jutaan voxel pada 120 FPS.

---

### H. `apps/demo` (Interactive 3D Studio Playground)
- Web playground berbasis Vite + TypeScript murni.
- Viewport 3D interaktif dengan kontrol orbit, zoom, dan sensor giroskop ponsel.
- Selector 3 model arketipe (Architecture, Globe, Circuit).
- Toggle mode scan, slider manual morphing, preset URL cepat.
- Bilah alat ekspor (Export GLB, Export STL, Export PNG, Export SVG).
- Panel Telemetry HUD real-time (Hash 64-bit, Seed PRNG, QR Specs, DNA Metadata, Palette Swatches).

---

## 6. 🏛️ Tiga Model Visual 3D Unggulan

| Parameter | 1. Architecture Model | 2. Globe Model | 3. Circuit Model |
| :--- | :--- | :--- | :--- |
| **Bentuk Visual 3D** | Kota metropolis *cyber-brutalist* | Gundukan kubah bola voxel (*dual-hemisphere mound*) | Motherboard PCB & microchip processor core |
| **Finder Patterns** | Menara landmark tertinggi berpenutup atap | Plateau puncak kubah dengan highlight emas | Chip mikroprosesor QFP IC dengan pin logam |
| **Modul Data** | Blok gedung pencakar langit bertingkat | Balok daratan kontinental gradasi warna | Resistor SMD, kapasitor keramik, via pad emas & trace tembaga |
| **Struktur $Z = 0$** | Substrate plate dasar gelap | Pelat ekuator disembunyikan (bola melayang murni) | Papan solder mask PCB (hijau, hitam, biru, merah) |
| **Mekanisme Morphing** | Gedung memendek rata ke tanah | Kubah atas merata ke 2D, kubah bawah menyusut ke 0 | Komponen elektronik melebur rata ke pelat biner 2D |

---

## 7. 💡 Sistem Mitigasi Pencahayaan & Bayangan Optik

Untuk menjamin pemindaian barcode dengan smartphone berjalan instan:
1. **Transisi Bayangan**: Saat $t > 0.85$, `directionalLight.castShadow` dinonaktifkan untuk menghilangkan bayangan miring gedung yang dapat mengaburkan modul putih.
2. **Kompensasi Pencahayaan**: Intensitas `directionalLight` diturunkan bertahap sementara `ambientLight` dinaikkan menjadi $1.0\times$ (pencahayaan difus merata).
3. **Peralihan Material**: Material modul dialihkan dari PBR specular (`metalness: 0.65`) menjadi matte murni (`roughness: 1.0, metalness: 0.0`) agar tidak memantulkan silau lampu.
4. **Binary Contrast 100%**: Modul gelap bertransisi ke hitam absolut (`#000000`) dan pelat substrate bertransisi ke putih solid (`#FFFFFF`).

---

## 8. 🛡️ Zero-WebGL Graceful Fallback & Sensor Giroskop

1. **Graceful Fallback**: Jika perangkat pengguna tidak mendukung WebGL, komponen `<JiwoQR />` (React) dan `<jiwo-qr>` (Web Component) secara otomatis mendeteksi ketiadaan WebGL dan beralih ke rendering Canvas 2D murni (`render2DFallbackCanvas`). Barcode tetap tampil dan 100% dapat dipindai.
2. **Holographic Gyroscope Tilt**: Di perangkat mobile, pengguna dapat mengaktifkan mode Giroskop untuk memiringkan ponsel dan melihat kedalaman 3D secara holografik real-time melalui event `deviceorientation`.

---

## 9. 📚 Dokumentasi & Integritas Repositori

Repositori telah dilengkapi dengan 10 berkas dokumentasi teknis lengkap:
1. [README.md](file:///d:/REPOS/jiwoQR/README.md) – Root monorepo overview, quick start & ekspor aset.
2. [packages/core/README.md](file:///d:/REPOS/jiwoQR/packages/core/README.md) – Multi-mode bitstream encoder, RS-ECC & DNA.
3. [packages/math/README.md](file:///d:/REPOS/jiwoQR/packages/math/README.md) – Vektor, easing curves, ekstrusi, spherical & circuit math.
4. [packages/renderer-webgl/README.md](file:///d:/REPOS/jiwoQR/packages/renderer-webgl/README.md) – Three.js WebGL engine, 3 models, fallback & gyro.
5. [packages/exporter/README.md](file:///d:/REPOS/jiwoQR/packages/exporter/README.md) – 3D print STL watertight & 2D high-res export engine.
6. [packages/react/README.md](file:///d:/REPOS/jiwoQR/packages/react/README.md) – Komponen React `<JiwoQR />` & Next.js SSR guide.
7. [packages/web-component/README.md](file:///d:/REPOS/jiwoQR/packages/web-component/README.md) – Custom Element `<jiwo-qr>` multi-framework.
8. [packages/renderer-webgpu/README.md](file:///d:/REPOS/jiwoQR/packages/renderer-webgpu/README.md) – Roadmap & kontrak WebGPU.
9. [apps/demo/README.md](file:///d:/REPOS/jiwoQR/apps/demo/README.md) – Panduan interactive studio, export toolbar & HUD.
10. [update_tracker.md](file:///d:/REPOS/jiwoQR/update_tracker.md) – Log audit historis seluruh perubahan file & rekayasa teknis.

---

## 10. 🧪 Hasil Verifikasi, Pengujian & Jaminan Mutu

| Uji Kualitas | Perintah | Hasil | Keterangan |
| :--- | :--- | :--- | :--- |
| **Vitest Unit Tests** | `pnpm test` | ✅ **100% PASS** | Pengujian enkoder multi-mode, RS-ECC, PRNG, kurva easing, dome mound, circuit transforms, dan eksportir STL/GLB/SVG. |
| **TypeScript Typecheck** | `pnpm typecheck` | ✅ **0 ERROR** | Pemeriksaan tipe statis ketat di seluruh workspace monorepo. |
| **Monorepo Build** | `pnpm build` | ✅ **SUKSES** | Seluruh bundle TypeScript berhasil terkompilasi ke direktori `dist/`. |
| **Git Remote Sync** | `git push origin main` | ✅ **SUKSES** | Seluruh kode, konfigurasi, dan dokumentasi telah tersinkronisasi di GitHub. |

---

## 11. 🚀 Panduan Menjalankan & Mengembangkan

### Prasyarat
- Node.js $\ge 18.0.0$
- pnpm $\ge 9.0.0$ / $12.0.0$

### Perintah Utama
```bash
# 1. Kloning repositori
git clone https://github.com/y7thangeru/jiwoQR.git
cd jiwoQR

# 2. Instalasi dependensi
pnpm install

# 3. Jalankan studio demo interaktif
pnpm dev

# 4. Jalankan pengujian unit
pnpm test

# 5. Jalankan pemeriksaan tipe statis
pnpm typecheck

# 6. Kompilasi build seluruh paket
pnpm build
```

---

*Laporan ini disusun secara komprehensif, mencakup seluruh aspek arsitektur, algoritma, implementasi grafika, pengujian kualitas, serta panduan integrasi ekosistem JiwoQR.*
