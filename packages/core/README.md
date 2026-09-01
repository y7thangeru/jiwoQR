# 🧬 @jiwoqr/core

> **Modul Inti Generator QR & DNA Visual Deterministik**  
> *Enkoder bitstream QR murni TypeScript sesuai ISO/IEC 18004, kalkulasi Galois Field Reed-Solomon ECC, serta generator DNA prosedural berbasis FNV-1a 64-bit dan Mulberry32 PRNG tanpa dependensi runtime pihak ketiga.*

[![Package: @jiwoqr/core](https://img.shields.io/badge/Package-%40jiwoqr%2Fcore-blue.svg)](file:///d:/REPOS/jiwoQR/packages/core)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg)](file:///d:/REPOS/jiwoQR/packages/core/package.json)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/core/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Modul](#-arsitektur-modul)
  - [1. Hashing & Normalisasi Input (`src/dna/hasher.ts`)](#1-hashing--normalisasi-input-srcdnahasherts)
  - [2. Mulberry32 PRNG (`src/dna/prng.ts`)](#2-mulberry32-prng-srcdnaprngts)
  - [3. Generator DNA Deterministik (`src/dna/generator.ts`)](#3-generator-dna-deterministik-srcdnageneratorts)
  - [4. Reed-Solomon Error Correction (`src/qr/reed-solomon.ts`)](#4-reed-solomon-error-correction-srcqrreed-solomonts)
  - [5. ISO/IEC 18004 Tables & Matrix Encoder (`src/qr/encoder.ts`)](#5-isoiec-18004-tables--matrix-encoder-srcqrencoderts)
- [Struktur Tipe Data & Interface](#-struktur-tipe-data--interface)
- [Panduan Penggunaan API](#-panduan-penggunaan-api)
  - [Fungsi Utama: `createJiwoQR`](#fungsi-utama-createjiwoqr)
  - [Enkoding Matriks QR Mandiri: `encodeQR`](#enkoding-matriks-qr-mandiri-encodeqr)
  - [Pembangkitan DNA Prosedural: `generateDNA`](#pembangkitan-dna-prosedural-generatedna)
- [Pengujian Unit](#-pengujian-unit)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/core` adalah fondasi logika dari seluruh ekosistem JiwoQR. Paket ini dirancang dengan prinsip:
- **Zero Runtime Dependencies**: Ditulis murni dalam TypeScript standar tanpa ketergantungan pada library pihak ketiga.
- **Kepatuhan Spesifikasi Standar**: Mengikuti spesifikasi resmi **ISO/IEC 18004** untuk encoding byte mode, Reed-Solomon Error Correction Code (ECC), masking bitwise optimal, serta margin wajib 4 modul *Quiet Zone*.
- **Deterministik Penuh**: Mengonversi setiap input string/URL menjadi benih acak (*seed*) 64-bit yang konsisten, sehingga menghasilkan palet warna, ketinggian ekstrusi, dan parameter model 3D yang selalu identik untuk input yang sama.

---

## 🏗️ Arsitektur Modul

```
packages/core/src/
├── dna/
│   ├── hasher.ts          # Hashing FNV-1a 64-bit & normalisasi URL
│   ├── prng.ts            # Mulberry32 Pseudo-Random Number Generator
│   └── generator.ts       # Pembangkitan palet warna, arsitektur, & globe DNA
├── qr/
│   ├── tables.ts          # Tabel kapasitas ISO/IEC 18004, alignment, & format bits
│   ├── reed-solomon.ts    # Aritmatika Galois Field GF(256) & pembagian polinomial
│   └── encoder.ts         # Bitstream encoder, 8 mask evaluation, matrix layout
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
Algoritma Fowler–Noll–Vo 1a varian 64-bit dipilih karena kecepatan eksekusinya yang sangat tinggi dan distribusi bit hash yang merata (*avalanche effect*):

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

Untuk membangkitkan angka acak semu berkecepatan tinggi dengan periode $2^{32}$, digunakan algoritma **Mulberry32**.
Konversi dari benih 64-bit `BigInt` ke bilangan bulat tak bertanda 32-bit (`uint32`) dilakukan secara aman menggunakan `BigInt.asUintN(32, seed)` untuk menghindari anomali bitwise pada JavaScript:

```typescript
export class Mulberry32 {
  private state: number;

  constructor(seed: bigint | number) {
    if (typeof seed === 'bigint') {
      this.state = Number(BigInt.asUintN(32, seed));
    } else {
      this.state = seed >>> 0;
    }
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  choice<T>(array: readonly T[]): T {
    return array[this.rangeInt(0, array.length - 1)];
  }
}
```

---

### 3. Generator DNA Deterministik (`src/dna/generator.ts`)

Membangkitkan entitas `DeterministicDNA` yang mengatur seluruh karakteristik visual renderer 3D:

1. **Palet Warna Harmonis**: Memilih dari palet bertema (*cyber, neon, brutalist, synthwave, obsidian, solar, emerald*) yang menjamin kontras tinggi terhadap latar belakang.
2. **Karakteristik Arsitektur**:
   - `maxHeight`: Rentang batas elevasi gedung pencakar langit ($2.5$ hingga $5.0$).
   - `heightVariance`: Variasi acak antar gedung ($0.3$ hingga $0.9$).
   - `roofStyle`: Model atap gedung (`flat`, `stepped`, `sloped`, `spire`).
   - `towerArchetype`: Gaya visual menara finder landmark (`monolith`, `citadel`, `obelisk`, `pagoda`).
   - `bevelRadius`: Radius sudut bevel modul.
3. **Karakteristik Globe**:
   - `continentElevation`: Elevasi daratan kontinental ($1.0$ hingga $2.5$).
   - `oceanDepth`: Kedalaman palung lautan.
   - `satelliteCount`: Jumlah orbit satelit ($0$ hingga $4$).
   - `rotationSpeed`: Kecepatan rotasi sumbu ($0.5\times$ hingga $1.5\times$).

---

### 4. Reed-Solomon Error Correction (`src/qr/reed-solomon.ts`)

Perhitungan Galois Field $\text{GF}(2^{8})$ berbasis polinomial primitif:
$$P(x) = x^8 + x^4 + x^3 + x^2 + 1 \quad (\text{0x11D} = 285)$$

- Menginisialisasi tabel eksponensial (`EXP_TABLE`) dan logaritma (`LOG_TABLE`) sepanjang 256 entri.
- Fungsi `gfMul(x, y)` untuk perkalian elemen Galois Field.
- Pembangkit polinomial generator $g(x) = \prod_{i=0}^{n-1} (x - \alpha^i)$.
- Pembagian polinomial modulo $g(x)$ untuk menghitung deretan *codeword* koreksi galat Reed-Solomon.

---

### 5. ISO/IEC 18004 Tables & Matrix Encoder (`src/qr/encoder.ts`)

Langkah-langkah penyusunan matriks QR:
1. **Analisis Versi & Kapasitas**: Memilih versi QR terkecil (1 hingga 40) yang dapat menampung panjang payload pada level ECC yang ditentukan.
2. **Penyusunan Bitstream**:
   - Menambahkan Mode Indicator 4-bit (`0100` untuk 8-bit Byte Mode).
   - Menambahkan Character Count Indicator (8-bit atau 16-bit tergantung versi).
   - Menuliskan payload byte data.
   - Menambahkan Terminator 4-bit (`0000`) dan *bit padding* hingga batas kelipatan 8.
   - Mengisi sisa kapasitas dengan byte padding bergantian `0xEC` dan `0x11`.
3. **Interleaving & Block Partitioning**: Membagi data ke dalam blok-blok RS dan menyusun codeword data serta codeword ECC secara bersilangan (*interleaved*).
4. **Pola Fungsional Tetap**:
   - Pola Pencari Posisi (*Finder Patterns*) $7\times7$ di tiga sudut.
   - Pemisah Finder (*Finder Separators*) 1 modul putih.
   - Pola Penyelaras (*Alignment Patterns*) $5\times5$ pada versi $\ge 2$.
   - Garis Penentuan Waktu (*Timing Patterns*) horizontal dan vertikal.
   - Modul Gelap Tetap (*Dark Module*).
5. **Evaluasi 8 Pola Masking**:
   - Menguji formula mask $0$ hingga $7$ dan menghitung nilai penalti ($N_1, N_2, N_3, N_4$) sesuai standar ISO/IEC 18004.
   - Memilih mask dengan penalti terendah untuk mencegah konsentrasi modul gelap/terang yang merugikan sensor optik.
6. **BCH Error Correction Format Info**: Menuliskan 15-bit format informasi (level ECC + pola mask terpilih) yang dilindungi oleh BCH Code $(15, 5)$ dan di-XOR dengan mask `0x5412`.
7. **Klasifikasi Semantik Modul & 4-Module Quiet Zone**:
   - Menambahkan margin zona tenang wajib $\ge 4$ modul di sekeliling matriks QR.
   - Setiap modul diberi tag tipe (`FINDER`, `ALIGNMENT`, `TIMING`, `DARK`, `DATA`, `QUIET`) sehingga renderer 3D dapat memberikan perlakuan visual khusus.

---

## 📐 Struktur Tipe Data & Interface

```typescript
export type ECCLevel = 'L' | 'M' | 'Q' | 'H';

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
  size: number;          // Ukuran inti QR tanpa quiet zone (cth: 21, 25)
  version: number;       // Versi QR (1 s.d. 40)
  ecc: ECCLevel;         // Tingkat koreksi kesalahan
  quietZone: number;     // Margin zona tenang (default: 4)
  totalSize: number;     // Total ukuran modul (size + 2 * quietZone)
  grid: QRModule[][];    // Matriks 2D [y][x]
  get(x: number, y: number): QRModule | undefined;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  groundSubstrate: string;
  finderEmissive: string;
}

export interface ArchitectureDNA {
  maxHeight: number;
  heightVariance: number;
  roofStyle: 'flat' | 'stepped' | 'sloped' | 'spire';
  facadeDensity: number;
  towerArchetype: 'monolith' | 'citadel' | 'obelisk' | 'pagoda';
  bevelRadius: number;
}

export interface GlobeDNA {
  continentElevation: number;
  oceanDepth: number;
  satelliteCount: number;
  rotationSpeed: number;
}

export interface DeterministicDNA {
  rawHash: bigint;
  seed32: number;
  normalizedUrl: string;
  palette: ColorPalette;
  architecture: ArchitectureDNA;
  globe: GlobeDNA;
}

export interface JiwoQREntity {
  matrix: QRMatrix;
  dna: DeterministicDNA;
}
```

---

## 💻 Panduan Penggunaan API

### Fungsi Utama: `createJiwoQR`

Mengonversi string atau URL menjadi entitas terpadu `JiwoQREntity` yang memuat matriks QR bitstream dan parameter DNA visual:

```typescript
import { createJiwoQR } from '@jiwoqr/core';

const entity = createJiwoQR('https://jiwoqr.dev', {
  ecc: 'Q',        // Level ECC yang diinginkan (default: 'Q')
  quietZone: 4,    // Margin quiet zone dalam modul (default: 4)
});

console.log('QR Version:', entity.matrix.version);
console.log('Total Grid Size:', entity.matrix.totalSize);
console.log('DNA Seed:', entity.dna.seed32);
console.log('Primary Color:', entity.dna.palette.primary);
console.log('Tower Archetype:', entity.dna.architecture.towerArchetype);
```

---

### Enkoding Matriks QR Mandiri: `encodeQR`

Menghasilkan matriks QR semantik saja:

```typescript
import { encodeQR } from '@jiwoqr/core';

const matrix = encodeQR('https://example.com', {
  ecc: 'H',
  quietZone: 4,
});

for (let y = 0; y < matrix.totalSize; y++) {
  let row = '';
  for (let x = 0; x < matrix.totalSize; x++) {
    const mod = matrix.get(x, y)!;
    row += mod.isDark ? '██' : '  ';
  }
  console.log(row);
}
```

---

### Pembangkitan DNA Prosedural: `generateDNA`

Membangkitkan profil visual deterministik dari teks sembarang:

```typescript
import { generateDNA, fnv1a64 } from '@jiwoqr/core';

const dna = generateDNA('https://my-custom-website.org');
console.log('Raw Hash:', dna.rawHash.toString(16));
console.log('Palette Theme:', dna.palette);
```

---

## 🧪 Pengujian Unit

Seluruh fungsi pada paket `@jiwoqr/core` diuji secara intensif menggunakan Vitest:

```bash
# Menjalankan pengujian unit di root monorepo
pnpm test

# Atau menjalankan spesifik pada paket core
pnpm --filter @jiwoqr/core test
```
