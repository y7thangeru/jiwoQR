# 🚀 JiwoQR Interactive Studio (`apps/demo`)

> **Playground & Studio Web Interaktif untuk Eksplorasi QR Prosedural 3D**  
> *Aplikasi web berbasis Vite dan TypeScript murni untuk menguji coba payload URL secara real-time, menginspeksi telemetri DNA deterministik, beralih arketipe visual (Architecture, Globe, Circuit PCB), menguji pemindaian barcode dengan smartphone, serta mengekspor aset 3D & cetak 2D.*

[![App: demo](https://img.shields.io/badge/App-Interactive%20Studio-blue.svg)](file:///d:/REPOS/jiwoQR/apps/demo)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg?logo=vite)](https://vitejs.dev/)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Fitur Utama Antarmuka (UI)](#-fitur-utama-antarmuka-ui)
  - [1. Viewport 3D & Orbit Kamera](#1-viewport-3d--orbit-kamera)
  - [2. Input URL & Preset Cepat](#2-input-url--preset-cepat)
  - [3. Selector Tiga Arketipe Model](#3-selector-tiga-arketipe-model)
  - [4. Kontrol Dual-Mode & Morph Scrub Slider](#4-kontrol-dual-mode--morph-scrub-slider)
  - [5. Bilah Alat Ekspor 3D & Cetak 2D](#5-bilah-alat-ekspor-3d--cetak-2d)
  - [6. Sensor Giroskop Holografik (Mobile)](#6-sensor-giroskop-holografik-mobile)
  - [7. Panel Telemetri DNA Deterministik](#7-panel-telemetri-dna-deterministik)
- [Cara Menjalankan Lokal](#-cara-menjalankan-lokal)
- [Struktur Berkas](#-struktur-berkas)

---

## 🌟 Gambaran Umum

Aplikasi `apps/demo` berfungsi sebagai showcase dan environment pengujian terintegrasi untuk seluruh paket dalam monorepo JiwoQR. Di sini, Anda dapat mengamati secara langsung bagaimana teks atau tautan URL diubah menjadi DNA visual dan matriks QR 3D dengan rendering 60 FPS.

---

## 🖥️ Fitur Utama Antarmuka (UI)

### 1. Viewport 3D & Orbit Kamera
- **Drag Mouse / Touch**: Memutar sudut pandang kamera 3D di sekeliling model secara bebas.
- **Scroll Mouse**: Zoom in dan zoom out dengan batas jarak aman (*clamped camera frustum*).

### 2. Input URL & Preset Cepat
- **Input Teks Real-time**: Masukkan URL apa pun (cth: `https://github.com`, tautan portofolio, dsb.) dan tekan *Enter* atau tombol *Generate*.
- **Preset Chips**: Tombol pintas untuk menguji variasi payload populer secara instan.

### 3. Selector Tiga Arketipe Model
- **Architecture**: Menghasilkan kota pencakar langit cyber-brutalist dengan menara finder landmark.
- **Globe**: Menghasilkan gundukan bola voxel 3D dual-hemisfer dengan gradien warna elevasi.
- **Circuit**: Menghasilkan motherboard PCB mikroelektronik dengan chip QFP, resistor/kapasitor SMD, dan jalur konduktor tembaga.

### 4. Kontrol Dual-Mode & Morph Scrub Slider
- **Tombol Mode Toggle**: Beralih otomatis antara *3D World* dan *2D Scan Mode* dengan transisi halus 800ms.
- **Morph Scrub Slider**: Menggeser posisi animasi transisi secara presisi dari $0.00$ (3D penuh) hingga $1.00$ (2D datar siap scan).

### 5. Bilah Alat Ekspor 3D & Cetak 2D
- **Export GLB**: Mengunduh file `.glb` 3D scene aktif Three.js.
- **Export STL**: Mengunduh file `.stl` biner watertight untuk software 3D printing slicer dengan ketinggian balok sesuai model 3D aktif.
- **Export PNG**: Mengunduh file `.png` 300 DPI ultra-tajam untuk percetakan fisik.
- **Export SVG**: Mengunduh file vector `.svg` mandiri dengan quiet zone.

### 6. Sensor Giroskop Holografik (Mobile)
- Tombol **Tilt Mode (Gyro)** mengaktifkan sensor `DeviceOrientationEvent` di ponsel untuk efek kedalaman 3D holografik saat memiringkan perangkat.

### 7. Panel Telemetri DNA Deterministik
HUD samping menampilkan informasi rekayasa data real-time:
- **64-bit Hash**: Nilai heksadesimal hash FNV-1a dari payload.
- **32-bit Seed**: Benih bilangan bulat yang menggerakkan Mulberry32 PRNG.
- **QR Specifications**: Versi QR (cth: `v3 (37x37)`), ukuran total modul, dan tingkat koreksi galat (*ECC Level*).
- **DNA Parameter Readout**:
  - *Mode Architecture*: Tipe menara (`MONOLITH`, `CITADEL`, `OBELISK`, `PAGODA`), batas tinggi, dan gaya atap.
  - *Mode Globe*: Jumlah satelit, elevasi benua, kedalaman samudera, dan kecepatan rotasi.
  - *Mode Circuit*: Paket chip IC (`QFP`, `BGA`), warna solder mask (`green`, `black`, `blue`, `red`), dan gaya trace.
- **Palette Swatches**: 5 kotak sampel warna (*Primary, Secondary, Accent, Substrate, Finder Glow*) yang dihasilkan secara deterministik.

---

## 🛠️ Cara Menjalankan Lokal

```bash
# Menjalankan Vite dev server
pnpm dev

# Atau menjalankan spesifik pada workspace demo
pnpm --filter demo dev
```

Buka peramban di: `http://localhost:5173`.

Build produksi:
```bash
pnpm --filter demo build
```

---

## 📁 Struktur Berkas

```
apps/demo/
├── index.html             # Layout HTML antarmuka studio, HUD, bilah ekspor & kontrol
├── src/
│   ├── main.ts            # Logika interaksi DOM, binding renderer, ekspor & sensor
│   └── style.css          # Desain tema gelap cyber/futuristik
├── vite.config.ts         # Konfigurasi Vite & cacheDir isolasi
└── package.json           # Manifest dependensi demo app
```
