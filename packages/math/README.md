# 📐 @jiwoqr/math

> **Fondasi Matematika Grafika, Easing & Proyeksi Spasial 3D**  
> *Transformasi vektor 3D, kurva interpolasi cubic easing, proyeksi ekstrusi arsitektur brutalist, pemetaan dual-hemisphere voxel mound dome, serta kalkulasi komponen sirkuit PCB untuk transisi mulus 3D ke 2D scan mode.*

[![Package: @jiwoqr/math](https://img.shields.io/badge/Package-%40jiwoqr%2Fmath-blue.svg)](file:///d:/REPOS/jiwoQR/packages/math)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/math/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Modul](#-arsitektur-modul)
- [Fungsi Interpolasi & Easing (`src/easing.ts`)](#-fungsi-interpolasi--easing-srceasingts)
- [Proyeksi Ekstrusi Arsitektur (`src/projections/extrusion.ts`)](#-proyeksi-ekstrusi-arsitektur-srcprojectionsextrusionts)
- [Proyeksi Spherical & Voxel Mound Dome (`src/projections/spherical.ts`)](#-proyeksi-spherical--voxel-mound-dome-srcprojectionssphericalts)
- [Proyeksi Komponen Sirkuit PCB (`src/projections/circuit.ts`)](#-proyeksi-komponen-sirkuit-pcb-srcprojectionscircuitts)
- [Proyeksi Mineral & Karang Biomorphic (`src/projections/biomorphic.ts`)](#-proyeksi-mineral--karang-biomorphic-srcprojectionsbiomorphicts)
- [Struktur Interface & Tipe Data](#-struktur-interface--tipe-data)
- [Contoh Penggunaan API](#-contoh-penggunaan-api)
- [Pengujian Unit](#-pengujian-unit)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/math` menyediakan fungsi-fungsi kalkulasi geometris dan transformasi spasial deterministik yang digunakan oleh engine renderer WebGL JiwoQR. Paket ini bertanggung jawab memastikan:
1. **Determinisme Geometris**: Transformasi setiap modul QR (posisi, rotasi, skala) dihitung murni secara matematis dari koordinat grid dan benih PRNG tanpa bergantung pada state global Three.js.
2. **Keterbacaan Optik 100%**: Menjamin bahwa saat parameter morfisme $t \to 1.0$, seluruh modul $3\text{D}$ bertransformasi tepat pada posisi kanonikal grid $2\text{D}$ dengan ketinggian mendekati nol ($Z \approx 0.02$).

---

## 🏗️ Arsitektur Modul

```
packages/math/src/
├── easing.ts                  # lerp, lerpVec3, easeInOutCubic, smoothstep
├── projections/
│   ├── extrusion.ts           # Ekstrusi ketinggian & transisi 3D-ke-2D Arsitektur
│   ├── spherical.ts           # Cube-to-sphere, UV-to-sphere & Voxel Dome Mound
│   ├── circuit.ts             # Transformasi IC chip, SMD resistor, via pad, & trace
│   ├── biomorphic.ts          # Transformasi prisma kristal heksagonal, pilar geodesik & karang
│   ├── city.ts                # Kalkulasi orientasi hadap jalan (street-facing), cellular zoning & CBD gradient
│   └── origami.ts             # Transformasi lipatan kertas origami, mountain/valley creases, & pembukaan mekanis
├── types.ts                   # Vec2, Vec3, transforms untuk semua 6 arketipe
└── index.ts                   # Ekspor publik
```

---

## 📈 Fungsi Interpolasi & Easing (`src/easing.ts`)

### 1. Linear Interpolation (`lerp` & `lerpVec3`)
$$\text{lerp}(a, b, t) = a + (b - a) \times t$$

### 2. Cubic Ease-In-Out (`easeInOutCubic`)
$$f(t) = \begin{cases} 4t^3 & \text{jika } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{jika } t \ge 0.5 \end{cases}$$

---

## 🏙️ Proyeksi Ekstrusi Arsitektur (`src/projections/extrusion.ts`)

Pada model Arsitektur, setiap modul gelap QR code diekstrusi ke sumbu $+Z$:
1. **Modul Finder**: $H_{\text{finder}} = H_{\text{max}} \times 1.75$ sebagai *landmark towers*.
2. **Modul Data**: $H_{\text{data}} = H_{\text{min}} + (H_{\text{max}} - H_{\text{min}}) \times \text{noise}(x, y, \text{seed})$.
3. **Interpolasi 3D-ke-2D (`interpolateExtrusion`)**: Berkurang secara mulus menuju $Z = 0.01$ dan $S_z = 0.02$.

---

## 🌍 Proyeksi Spherical & Voxel Mound Dome (`src/projections/spherical.ts`)

Formula medan elevasi kubah bola simetris:
$$H(x, y) = H_{\text{max}} \times \sqrt{\max\left(0, 1 - \left(\frac{\text{dist}(x, y)}{R_{\text{max}}}\right)^2\right)}$$
- **Top Mound A**: Menempel di $Z = 0$ diekstrusi ke $+Z$.
- **Bottom Mound B**: Menempel di $Z = 0$ diekstrusi ke $-Z$.
- Pertemuan kedua kubah membentuk bola voxel padu tanpa pelat pembelah di mode 3D.

---

## 🔌 Proyeksi Komponen Sirkuit PCB (`src/projections/circuit.ts`)

Menentukan jenis dan orientasi komponen elektronik mikro pada modul QR:
1. **Pola Finder**: Diberi tipe `chip` (paket IC QFP dengan pin logam).
2. **Modul Data**: Secara deterministik dibagi menjadi:
   - `smd_resistor`: Balok resistor dengan tutup solder perak.
   - `smd_capacitor`: Balok kapasitor keramik cokelat muda.
   - `via_pad`: Silinder solder via pad emas.
   - `trace`: Jalur konduktor tembaga dengan sudut 45 atau 90 derajat.
3. **Interpolasi Morphing (`interpolateCircuitMorph`)**:
   - Memutar orientasi komponen kembali ke sudut $\text{Rot} = (0, 0, 0)$.
   - Meratakan tinggi modul $S_z \to 0.02$ tepat di atas pelat solder mask.

---

## 💎 Proyeksi Mineral & Karang Biomorphic (`src/projections/biomorphic.ts`)

Mengalkulasi pertumbuhan kristal mineral prisma heksagonal dan formasi karang:
1. **Pola Finder**: Dimodelkan sebagai klaster monolitik kristal geodesik bercahaya tinggi ($H_{\text{finder}} = H_{\text{max}} \times 1.85$).
2. **Modul Data**: Memiliki gaya pertumbuhan deterministik (`hexagonal`, `needle_prism`, `geode_cluster`, `coral_branch`) dengan variasi sudut facet $\theta_{\text{rot}}$ dan kemiringan organik $\phi_{\text{tilt}}$.
3. **Interpolasi Morphing (`interpolateBiomorphicMorph`)**:
   - Merotasikan kristal kembali tegak lurus ($\theta_{\text{rot}} \to 0, \phi_{\text{tilt}} \to 0$).
   - Menurunkan ketinggian $S_z \to 0.02$ tepat di atas pelat dasar.

---

## 🏙️ Proyeksi Tata Kota Metropolis (`src/projections/city.ts`)

Mengalkulasi parameter urban planning deterministik untuk model Kota Realistis (Model 5):
1. **Orientasi Hadap Jalan (`computeStreetFacingAngle`)**:
   - Menganalisa 4 tetangga ortogonal sel QR $(x \pm 1, y \pm 1)$.
   - Jika 1 sisi terbuka (modul terang = jalan raya), bangunan berotasi menghadap jalan tersebut ($0^\circ, 90^\circ, 180^\circ, 270^\circ$).
   - Jika berada di sudut pertemuan 2 jalan (corner lot), bangunan berotasi diagonal $45^\circ$ atau sejajar koridor utama.
2. **Cellular Block Zoning & CBD Gradient (`computeCityModuleTransform`)**:
   - Membagi matriks QR ke dalam blok seluler $3\times3$ atau $4\times4$ agar gedung-gedung bertetangga memiliki keharmonisan arsitektur.
   - Mengalkulasi jarak radial ke pusat matriks ($c_x, c_y$); sel di dekat pusat (*Central Business District*) memiliki probabilitas tinggi menjadi pencakar langit megah (*High-Rise*), sedangkan tepi matriks menjadi blok residensial/komersial menengah (*Mid-Rise / Urban Block*).
   - Tiga sudut Finder Pattern dimodelkan sebagai menara *Civic Landmark* monumental dengan elevasi $2.2\times$.
3. **Interpolasi Morphing (`interpolateCityTransform`)**:
   - Memutar orientasi yaw kembali ke $0^\circ$.
   - Mengompresi ketinggian bangunan $S_z \to 0.02$ dan melebarkan dimensi horizontal ke ukuran penuh modul untuk pemindaian instan.

---

## 📄 Proyeksi Origami Paper Folds & Pembukaan Mekanis (`src/projections/origami.ts`)

Mengalkulasi parameter lipatan kertas geometris dan mekanisme pembukaan lipatan (*unfolding*) untuk Model 6 (Origami):
1. **Gaya Lipatan Kertas (`OrigamiFoldStyle`)**:
   - `mountain`: Puncak lipatan cembung tajam dengan sudut kemiringan $28^\circ \dots 52^\circ$.
   - `valley`: Lembah lipatan cekung simetris.
   - `diagonal_pyramid`: Lipatan piramida bersudut empat dengan 8 faset segitiga.
   - `crane_wing`: Mahkota derek origami bersusun untuk 3 Finder Patterns ($H_{\text{finder}} = H_{\text{max}} \times 2.0$, ketajaman faset $0.95$).
2. **Orientasi Crease Ortogonal & Diagonal**:
   - Sudut rotasi $Z$ dihitung deterministik: $[0, \frac{\pi}{4}, \frac{\pi}{2}, \frac{3\pi}{4}]$.
3. **Mekanisme Unfolding (`calculateOrigamiUnfold`)**:
   - Saat $t \to 1.0$, sudut lipatan $\theta_{\text{fold}} \to 0$ dan rotasi $Z \to 0$.
   - Ketinggian $Z$ mengompresi ke bidang datar kanonikal $S_z = 0.01$ dan modul melebar ke $1.0\times1.0$ untuk pemindaian instan.

---

## 📐 Struktur Interface & Tipe Data

```typescript
export type BiomorphicCrystalStyle =
  | 'hexagonal'
  | 'coral_branch'
  | 'geode_cluster'
  | 'needle_prism';

export interface BiomorphicModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  isFinder: boolean;
  crystalStyle: BiomorphicCrystalStyle;
  position3D: Vec3;
  position2D: Vec3;
  scale3D: Vec3;
  scale2D: Vec3;
  rotationZ: number;
  tiltAngle: number;
}
```

---

## 💻 Contoh Penggunaan API

```typescript
import {
  computeCircuitModuleTransform,
  interpolateCircuitMorph,
} from '@jiwoqr/math';

// Menghitung transformasi sirkuit PCB untuk modul
const transform = computeCircuitModuleTransform(
  8,     // gridX
  12,    // gridY
  29,    // totalGridSize
  true,  // isDark
  false, // isFinder
  98765  // seed32
);

console.log('Tipe Komponen:', transform.componentType); // 'smd_resistor' | 'via_pad' | etc.

// Interpolasi saat morphing ke scan mode
const current = interpolateCircuitMorph(transform, 0.8);
```

---

## 🧪 Pengujian Unit

```bash
pnpm test
```
Memverifikasi batas kurva easing, proyeksi ekstrusi arsitektur, radial falloff gundukan bola, serta akurasi penempatan komponen circuit PCB.
