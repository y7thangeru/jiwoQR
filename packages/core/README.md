# 🧬 @jiwoqr/core

> **Modul Inti Generator QR & DNA Visual Deterministik**  
> *Enkoder bitstream multi-mode QR murni TypeScript sesuai ISO/IEC 18004, kompresi numerik & alfanumerik, kalkulasi Galois Field Reed-Solomon ECC, serta generator DNA prosedural berbasis FNV-1a 64-bit dan Mulberry32 PRNG tanpa dependensi runtime pihak ketiga.*

[![Package: @jiwoqr/core](https://img.shields.io/badge/Package-%40jiwoqr%2Fcore-blue.svg)](file:///d:/REPOS/jiwoQR/packages/core)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](file:///d:/REPOS/jiwoQR/packages/core/package.json)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/core/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Modul](#-arsitektur-modul)
  - [1. Hashing & Normalisasi Input (`src/dna/hasher.ts`)](#1-hashing--normalisasi-input-srcdnahasherts)
  - [2. Mulberry32 PRNG (`src/dna/prng.ts`)](#2-mulberry32-prng-srcdnaprngts)
  - [3. Generator DNA Deterministik & Arketipe Circuit (`src/dna/generator.ts`)](#3-generator-dna-deterministik--arketipe-circuit-srcdnageneratorts)
  - [4. Reed-Solomon Error Correction (`src/qr/reed-solomon.ts`)](#4-reed-solomon-error-correction-srcqrreed-solomonts)
  - [5. ISO/IEC 18004 Multi-Mode Matrix Encoder (`src/qr/encoder.ts`)](#5-isoiec-18004-multi-mode-matrix-encoder-srcqrencoderts)
- [Struktur Tipe Data & Interface](#-struktur-tipe-data--interface)
- [Panduan Penggunaan API](#-panduan-penggunaan-api)
  - [Fungsi Utama: `createJiwoQR`](#fungsi-utama-createjiwoqr)
  - [Enkoding Matriks QR Multi-Mode: `encodeQR`](#enkoding-matriks-qr-multi-mode-encodeqr)
  - [Pembangkitan DNA Prosedural: `generateDNA`](#pembangkitan-dna-prosedural-generatedna)
- [Pengujian Unit](#-pengujian-unit)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/core` adalah fondasi logika dari seluruh ekosistem JiwoQR. Paket ini dirancang dengan prinsip:
- **Zero Runtime Dependencies**: Ditulis murni dalam TypeScript standar tanpa ketergantungan pada library pihak ketiga.
- **Kepatuhan Spesifikasi Standar**: Mengikuti spesifikasi resmi **ISO/IEC 18004** untuk encoding multi-mode (Numeric, Alphanumeric, Byte), Reed-Solomon Error Correction Code (ECC), masking bitwise optimal, serta margin wajib 4 modul *Quiet Zone*.
- **Deterministik Penuh**: Mengonversi setiap input string/URL menjadi benih acak (*seed*) 64-bit yang konsisten, menghasilkan palet warna, siluet arsitektur, parameter globe, dan konfigurasi PCB circuit yang selalu identik untuk input yang sama.

---

## 🏗️ Arsitektur Modul

```
packages/core/src/
├── dna/
│   ├── hasher.ts          # Hashing FNV-1a 64-bit & normalisasi URL
│   ├── prng.ts            # Mulberry32 Pseudo-Random Number Generator
│   └── generator.ts       # Pembangkitan palet warna, arsitektur, globe & circuit DNA
├── qr/
│   ├── tables.ts          # Tabel kapasitas ISO/IEC 18004, alignment, & format bits
│   ├── reed-solomon.ts    # Aritmatika Galois Field GF(256) & pembagian polinomial
│   └── encoder.ts         # Multi-mode bitstream encoder, 8 mask evaluation, matrix layout
├── types.ts               # Interface TypeScript publik
└── index.ts               # Entry point ekspor publik
```

---

### 1. Hashing & Normalisasi Input (`src/dna/hasher.ts`)

#### Normalisasi URL (`normalizeInput`)
Untuk mencegah perbedaan visual yang tidak diinginkan akibat variasi penulisan kecil pada URL (seperti huruf kapital pada domain atau port default), fungsi `normalizeInput` melakukan standardisasi:
- Mengubah skema protokol (`http://`, `https://`) dan hostname menjadi huruf kecil (*lowercase*).
- Menghapus port standar (`:80`, `:443`).
- Menghilangkan *trailing slash* yang berlebihan pada root path.

#### Algoritma FNV-1a 64-bit (`fnv1a64`)
```typescript
const FNV_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;

export function fnv1a64(input: string): bigint {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME) & 0xffffffffffffffffn;
  }
  return hash;
}
```

---

### 2. Mulberry32 PRNG (`src/dna/prng.ts`)

Menggunakan algoritma **Mulberry32** dengan konversi aman dari benih 64-bit `BigInt` ke `uint32` melalui `BigInt.asUintN(32, seed)`.

---

### 3. Generator DNA Deterministik & Arketipe Circuit (`src/dna/generator.ts`)

Membangkitkan entitas `DeterministicDNA` yang mengatur seluruh karakteristik visual renderer 3D:

1. **Palet Warna Harmonis**: Pilihan tema (*cyber, neon, brutalist, synthwave, obsidian, solar, emerald*).
2. **Karakteristik Arsitektur**: `maxHeight`, `heightVariance`, `roofStyle` (`flat`, `stepped`, `sloped`, `spire`), dan `towerArchetype` (`monolith`, `citadel`, `obelisk`, `pagoda`).
3. **Karakteristik Globe**: `continentElevation`, `oceanDepth`, `satelliteCount`, dan `rotationSpeed`.
4. **Karakteristik Circuit (`CircuitDNA`)**:
   - `traceStyle`: Jalur tembaga (`ortho-45` sudut 45 derajat, `manhattan` sudut 90 derajat, `curved`).
   - `chipPackage`: Tipe kemasan IC mikroprosesor finder (`QFP`, `BGA`, `DIP`, `SOP`).
   - `solderMaskColor`: Warna lapisan pelindung PCB (`green`, `black`, `blue`, `red`, `purple`).
   - `componentDensity`: Kepadatan resistor/kapasitor SMD.
   - `viaDensity`: Kepadatan via pad solder emas.
   - `traceWidth`: Lebar jalur konduktor.
5. **Karakteristik Biomorphic (`BiomorphicDNA`)**:
   - `crystalGrowthStyle`: Gaya pertumbuhan prisma kristal (`hexagonal`, `needle_prism`, `geode_cluster`, `coral_branch`).
   - `refractionIndex`: Indeks bias optik mineral ($1.33$ hingga $1.72$).
   - `facetSharpness`: Ketajaman facet prisma kristal.
   - `clusterDensity`: Kepadatan formasi kristal geodesik.
   - `glowIntensity`: Intensitas pendaran monolit finder kristal.
6. **Karakteristik Kota Metropolis (`CityDNA`)**:
   - `zoningArchetype`: Gaya zoning distrik perkotaan (`commercial`, `residential`, `civic`, `industrial`, `mixed`).
   - `skylineDensity`: Kepadatan menara pencakar langit di pusat distrik CBD.
   - `streetOrientationBias`: Kecenderungan rotasi fasad gedung menghadap jalan raya terbuka (*orthogonal 4-way analysis*).
   - `landmarkStyle`: Bentuk dan elevasi menara sudut monumental (*spire*, *obelisk*, *citadel*).
   - `buildingScale`: Proporsi skala gedung relatif terhadap modul QR.
7. **Karakteristik Origami Fold (`OrigamiDNA`)**:
   - `foldStyle`: Gaya lipatan kertas geometris (`mountain`, `valley`, `diagonal_pyramid`, `crane_wing`).
   - `creaseSharpness`: Ketajaman lipatan faset segitiga ($0.50$ hingga $0.95$).
   - `paperWeight`: Tekstur bobot kertas (`washi`, `heavy_cardstock`, `metallic_foil`).
   - `unfoldPattern`: Pola pembukaan mekanis saat morphing (`radial_spiral`, `mechanical_flatten`, `diagonal_split`).
   - `facetAngle`: Sudut faset lipatan kertas ($25.0^\circ$ hingga $55.0^\circ$).

---

### 4. Reed-Solomon Error Correction (`src/qr/reed-solomon.ts`)

Perhitungan Galois Field $\text{GF}(2^{8})$ berbasis polinomial primitif $P(x) = x^8 + x^4 + x^3 + x^2 + 1$ (285):
- Tabel eksponensial (`EXP_TABLE`) dan logaritma (`LOG_TABLE`) 256 entri.
- Fungsi `gfMul(x, y)` untuk perkalian Galois Field.
- Pembangkit polinomial generator $g(x) = \prod_{i=0}^{n-1} (x - \alpha^i)$.
- Pembagian polinomial modulo $g(x)$ untuk menghasilkan deretan *codeword* koreksi galat.

---

### 5. ISO/IEC 18004 Multi-Mode Matrix Encoder (`src/qr/encoder.ts`)

Mendukung deteksi dan kompresi bitstream otomatis:
1. **Mode Numeric (Mode Indicator `0001`)**:
   - Memadatkan 3 digit angka (`0-9`) ke dalam 10 bit, 2 digit ke 7 bit, dan 1 digit ke 4 bit.
   - Mengurangi ukuran versi QR secara signifikan untuk nomor telepon, ID numerik, atau kode OTP.
2. **Mode Alphanumeric (Mode Indicator `0010`)**:
   - Mendukung 45 karakter: `0-9`, `A-Z`, spasi, `$`, `%`, `*`, `+`, `-`, `.`, `/`, `:`.
   - Memadatkan 2 karakter ke dalam 11 bit dengan formula: $V = c_1 \times 45 + c_2$.
3. **Mode Byte (Mode Indicator `0100`)**:
   - 8-bit byte stream untuk URL, string campuran, dan karakter UTF-8.
4. **Auto-Mode Detection (`detectQRMode`)**:
   - Memilih mode terpadat secara otomatis jika opsi `mode: 'auto'` digunakan.
5. **Evaluasi 8 Pola Masking & Format Info BCH**:
   - Menghitung penalti $N_1, N_2, N_3, N_4$ untuk memilih mask terbaik.
   - Menambahkan format info 15-bit berpelindung BCH $(15, 5)$.
6. **Margin 4 Modul Quiet Zone & Tag Semantik Modul**.

---

## 📐 Struktur Tipe Data & Interface

```typescript
export type ECCLevel = 'L' | 'M' | 'Q' | 'H';

export type QRMode = 'numeric' | 'alphanumeric' | 'byte';
export type QRModeOption = 'auto' | QRMode;

export type ModuleType =
  | 'FINDER'
  | 'FINDER_SEPARATOR'
  | 'ALIGNMENT'
  | 'TIMING'
  | 'DARK'
  | 'FORMAT'
  | 'VERSION'
  | 'DATA'
  | 'QUIET';

export interface QRModule {
  x: number;
  y: number;
  isDark: boolean;
  type: ModuleType;
}

export interface QRMatrix {
  size: number;
  version: number;
  ecc: ECCLevel;
  quietZone: number;
  totalSize: number;
  grid: QRModule[][];
  get(x: number, y: number): QRModule | undefined;
}

export interface CircuitDNA {
  traceStyle: 'orthogonal' | 'diagonal' | 'curved';
  chipPackage: 'qfp' | 'bga' | 'soic';
  solderMaskColor: 'green' | 'black' | 'blue' | 'purple';
  componentDensity: number;
  viaDensity: number;
  traceWidth: number;
}

export interface BiomorphicDNA {
  crystalGrowthStyle: 'hexagonal' | 'coral_branch' | 'geode_cluster' | 'needle_prism';
  refractionIndex: number;
  facetSharpness: number;
  clusterDensity: number;
  glowIntensity: number;
}

export interface DeterministicDNA {
  rawHash: bigint;
  seed32: number;
  normalizedUrl: string;
  palette: ColorPalette;
  architecture: ArchitectureDNA;
  globe: GlobeDNA;
  circuit: CircuitDNA;
  biomorphic: BiomorphicDNA;
}

export interface EncodeOptions {
  ecc?: ECCLevel;
  minVersion?: number;
  maxVersion?: number;
  quietZone?: number;
  mode?: QRModeOption;
}
```

---

## 💻 Panduan Penggunaan API

### Fungsi Utama: `createJiwoQR`

```typescript
import { createJiwoQR } from '@jiwoqr/core';

const entity = createJiwoQR('https://jiwoqr.dev', {
  ecc: 'Q',        // Level ECC (default: 'Q')
  quietZone: 4,    // Margin quiet zone (default: 4)
  mode: 'auto',    // Deteksi mode bitstream otomatis
});

console.log('QR Version:', entity.matrix.version);
console.log('Circuit Mask:', entity.dna.circuit.solderMaskColor);
console.log('Chip Package:', entity.dna.circuit.chipPackage);
```

---

### Enkoding Matriks QR Multi-Mode: `encodeQR`

```typescript
import { encodeQR } from '@jiwoqr/core';

// 1. Numerik: menghasilkan versi QR lebih kecil
const numMatrix = encodeQR('0812345678901234', { mode: 'numeric' });

// 2. Alfanumerik
const alphaMatrix = encodeQR('HTTP://JIWOQR.DEV/CODE123', { mode: 'alphanumeric' });
```

---

## 🧪 Pengujian Unit

```bash
pnpm test
```
Test suite memverifikasi akurasi packing bitstream numeric/alphanumeric, deteksi mode otomatis, perhitungan Reed-Solomon, serta stabilitas deterministik `CircuitDNA`.
