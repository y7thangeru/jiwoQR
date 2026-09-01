# 📐 @jiwoqr/math

> **Fondasi Matematika Grafika, Easing & Proyeksi Spasial 3D**  
> *Transformasi vektor 3D, kurva interpolasi cubic easing, proyeksi ekstrusi arsitektur brutalist, serta pemetaan dual-hemisphere voxel mound dome untuk transisi mulus 3D ke 2D scan mode.*

[![Package: @jiwoqr/math](https://img.shields.io/badge/Package-%40jiwoqr%2Fmath-blue.svg)](file:///d:/REPOS/jiwoQR/packages/math)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/math/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Arsitektur Modul](#-arsitektur-modul)
- [Fungsi Interpolasi & Easing (`src/easing.ts`)](#-fungsi-interpolasi--easing-srceasingts)
- [Proyeksi Ekstrusi Arsitektur (`src/projections/extrusion.ts`)](#-proyeksi-ekstrusi-arsitektur-srcprojectionsextrusionts)
- [Proyeksi Spherical & Voxel Mound Dome (`src/projections/spherical.ts`)](#-proyeksi-spherical--voxel-mound-dome-srcprojectionssphericalts)
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
│   └── spherical.ts           # Cube-to-sphere, UV-to-sphere & Voxel Dome Mound
├── types.ts                   # Vec2, Vec3, ExtrusionModuleTransform, SpherifiedModuleTransform
└── index.ts                   # Ekspor publik
```

---

## 📈 Fungsi Interpolasi & Easing (`src/easing.ts`)

### 1. Linear Interpolation (`lerp` & `lerpVec3`)
$$\text{lerp}(a, b, t) = a + (b - a) \times t$$

### 2. Cubic Ease-In-Out (`easeInOutCubic`)
Kurva transisi non-linear berakselerasi halus di awal dan melambat di akhir:

$$f(t) = \begin{cases} 4t^3 & \text{jika } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{jika } t \ge 0.5 \end{cases}$$

```typescript
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
```

---

## 🏙️ Proyeksi Ekstrusi Arsitektur (`src/projections/extrusion.ts`)

Pada model Arsitektur, setiap modul gelap QR code diekstrusi ke sumbu $+Z$ dengan aturan:
1. **Modul Finder (Pola Sudut)**:
   Modul pencari posisi diekstrusi lebih tinggi sebagai *landmark towers*:
   $$H_{\text{finder}} = H_{\text{max}} \times \text{landmarkMultiplier} \quad (\text{default: } 1.75\times)$$
2. **Modul Data Prosedural**:
   Modul data reguler diberi variasi ketinggian deterministik berdasarkan hashing koordinat grid $(x, y)$ dan seed PRNG:
   $$H_{\text{data}} = H_{\text{min}} + (H_{\text{max}} - H_{\text{min}}) \times \text{noiseScale}(x, y, \text{seed})$$
3. **Interpolasi 3D ke 2D (`interpolateExtrusion`)**:
   Saat berpindah ke Mode Scan ($t \in [0, 1]$), posisi $Z$ dan skala tinggi $S_z$ bertransisi secara mulus:
   $$\mathbf{P}(t) = \text{lerpVec3}(\mathbf{P}_{3\text{D}}, \mathbf{P}_{2\text{D}}, \text{easeInOutCubic}(t))$$
   $$\mathbf{S}(t) = \text{lerpVec3}(\mathbf{S}_{3\text{D}}, \mathbf{S}_{2\text{D}}, \text{easeInOutCubic}(t))$$

---

## 🌍 Proyeksi Spherical & Voxel Mound Dome (`src/projections/spherical.ts`)

### 1. Pemetaan Spherified Cube (`cubeToSphere`)
Mengonversi titik kubus $[-1, 1]^3$ ke permukaan bola unit untuk mencegah distorsi di kutub:
$$x' = x \sqrt{1 - \frac{y^2}{2} - \frac{z^2}{2} + \frac{y^2 z^2}{3}}$$
$$y' = y \sqrt{1 - \frac{z^2}{2} - \frac{x^2}{2} + \frac{z^2 x^2}{3}}$$
$$z' = z \sqrt{1 - \frac{x^2}{2} - \frac{y^2}{2} + \frac{x^2 y^2}{3}}$$

### 2. Dual-Hemisphere Voxel Mound Dome (`computeGlobeModuleTransform`)
Pada model Globe (arsitektur medan voxel), modul-modul disusun membentuk gundukan kubah bola 3D simetris:
- Jarak radial modul dari pusat grid dihitung sebagai:
  $$\text{dist} = \sqrt{x_{\text{world}}^2 + y_{\text{world}}^2}, \quad r = \min\left(1.0, \frac{\text{dist}}{R_{\text{max}}}\right)$$
- Profil ketinggian kubah setengah lingkaran:
  $$\text{domeFactor} = \sqrt{\max\left(0, 1 - r^2\right)}$$
- Ketinggian modul voxel 3D:
  $$H_{\text{dome}}(x, y) = \max\left(0.2, H_{\text{max}} \times \text{domeFactor} \times \text{noise}(x, y)\right)$$
- **Top Mound A**: Menempel pada bidang ekuator $Z = 0$ dan diekstrusi ke $+Z$.
- **Bottom Mound B**: Menempel pada bidang ekuator $Z = 0$ dan diekstrusi ke $-Z$.
- Pertemuan kedua kubah di $Z = 0$ membentuk bola voxel padu tanpa garis pembatas.

---

## 📐 Struktur Interface & Tipe Data

```typescript
export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ExtrusionModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  position3D: Vec3;
  position2D: Vec3;
  scale3D: Vec3;
  scale2D: Vec3;
}

export interface SpherifiedModuleTransform {
  gridX: number;
  gridY: number;
  isDark: boolean;
  isFinder: boolean;
  position3D: Vec3;
  normal3D: Vec3;
  scale3D: Vec3;
  position2D: Vec3;
  scale2D: Vec3;
}
```

---

## 💻 Contoh Penggunaan API

```typescript
import {
  computeExtrusionTransform,
  interpolateExtrusion,
  computeGlobeModuleTransform,
  interpolateGlobeMorph,
} from '@jiwoqr/math';

// 1. Menghitung transformasi ekstrusi untuk modul grid (10, 10)
const transform = computeExtrusionTransform(
  10,    // gridX
  10,    // gridY
  29,    // totalGridSize
  true,  // isDark
  false, // isFinder
  12345, // seed32
  { maxHeight: 4.0, landmarkMultiplier: 1.75 }
);

// 2. Evaluasi interpolasi pada progress t = 0.5 (setengah jalan morphing)
const currentSpasial = interpolateExtrusion(transform, 0.5);
console.log('Current Position:', currentSpasial.position);
console.log('Current Scale:', currentSpasial.scale);
```

---

## 🧪 Pengujian Unit

```bash
pnpm test
```
Verifikasi unit test mencakup pengujian batas nilai easing, determinisme ekstrusi ketinggian, serta ketepatan unrolling 3D ke 2D.
