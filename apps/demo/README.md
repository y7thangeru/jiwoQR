# 🚀 JiwoQR Interactive Studio (`apps/demo`)

> **Playground & Studio Web Interaktif untuk Eksplorasi QR Prosedural 3D**  
> *Aplikasi web berbasis Vite dan TypeScript murni untuk menguji coba payload URL secara real-time, menginspeksi telemetri DNA deterministik, beralih arketipe visual (Architecture vs Globe), serta menguji pemindaian barcode dengan smartphone.*

[![App: demo](https://img.shields.io/badge/App-Interactive%20Studio-blue.svg)](file:///d:/REPOS/jiwoQR/apps/demo)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg?logo=vite)](https://vitejs.dev/)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Fitur Utama Antarmuka (UI)](#-fitur-utama-antarmuka-ui)
  - [1. Viewport 3D & Orbit Kamera](#1-viewport-3d--orbit-kamera)
  - [2. Input URL & Preset Cepat](#2-input-url--preset-cepat)
  - [3. Selector Model Arketipe](#3-selector-model-arketipe)
  - [4. Kontrol Dual-Mode & Morph Scrub Slider](#4-kontrol-dual-mode--morph-scrub-slider)
  - [5. Panel Telemetri DNA Deterministik](#5-panel-telemetri-dna-deterministik)
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

### 3. Selector Model Arketipe
- **Architecture**: Menghasilkan kota pencakar langit cyber-brutalist dengan menara finder landmark.
- **Globe**: Menghasilkan gundukan bola voxel 3D dual-hemisfer dengan gradien warna elevasi.

### 4. Kontrol Dual-Mode & Morph Scrub Slider
- **Tombol Mode Toggle**: Beralih otomatis antara *3D World* dan *2D Scan Mode* dengan transisi halus 800ms.
- **Morph Scrub Slider**: Menggeser posisi animasi transisi secara presisi dari $0.00$ (3D penuh) hingga $1.00$ (2D datar siap scan).

### 5. Panel Telemetri DNA Deterministik
HUD samping menampilkan informasi rekayasa data real-time:
- **64-bit Hash**: Nilai heksadesimal hash FNV-1a dari payload.
- **32-bit Seed**: Benih bilangan bulat yang menggerakkan Mulberry32 PRNG.
- **QR Specifications**: Versi QR (cth: `v3 (37x37)`), ukuran total modul, dan tingkat koreksi galat (*ECC Level*).
- **DNA Parameter Readout**:
  - *Mode Architecture*: Tipe menara (`MONOLITH`, `CITADEL`, `OBELISK`, `PAGODA`), batas tinggi, dan gaya atap.
  - *Mode Globe*: Jumlah satelit, elevasi benua, kedalaman samudera, dan kecepatan rotasi.
- **Palette Swatches**: 5 kotak sampel warna (*Primary, Secondary, Accent, Substrate, Finder Glow*) yang dihasilkan secara deterministik untuk input tersebut.

---

## 🛠️ Cara Menjalankan Lokal

Pastikan Anda berada di direktori root monorepo:

```bash
# Menjalankan Vite dev server
pnpm dev

# Atau menjalankan spesifik pada workspace demo
pnpm --filter demo dev
```

Buka peramban Anda di: `http://localhost:5173`.

Untuk membuat build produksi:
```bash
pnpm --filter demo build
```
Hasil build statis akan tersedia di `apps/demo/dist`.

---

## 📁 Struktur Berkas

```
apps/demo/
├── index.html             # Layout HTML antarmuka studio, HUD, & kontrol
├── src/
│   ├── main.ts            # Logika interaksi DOM, binding renderer, & sinkronisasi HUD
│   └── style.css          # Desain tema gelap cyber/futuristik
├── vite.config.ts         # Konfigurasi Vite & module bundling
└── package.json           # Manifest dependensi demo app
```
