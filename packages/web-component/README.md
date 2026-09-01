# 🧩 @jiwoqr/web-component

> **Native Custom Element `<jiwo-qr>` Tanpa Framework**  
> *Gunakan generator QR prosedural 3D JiwoQR langsung di HTML murni, Vue, Svelte, Angular, SolidJS, atau Astro menggunakan standar Web Components W3C.*

[![Package: @jiwoqr/web-component](https://img.shields.io/badge/Package-%40jiwoqr%2Fweb--component-blue.svg)](file:///d:/REPOS/jiwoQR/packages/web-component)
[![Web Components](https://img.shields.io/badge/Standard-W3C%20Custom%20Elements-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](file:///d:/REPOS/jiwoQR/packages/web-component/tsconfig.json)

---

## 📖 Daftar Isi

- [Gambaran Umum](#-gambaran-umum)
- [Instalasi & Registrasi](#-instalasi--registrasi)
- [Atribut & Properti HTML](#-atribut--properti-html)
- [Metode JavaScript DOM](#-metode-javascript-dom)
- [Contoh Penggunaan](#-contoh-penggunaan)
  - [1. HTML Murni & Vanilla JavaScript](#1-html-murni--vanilla-javascript)
  - [2. Integrasi Vue 3](#2-integrasi-vue-3)
  - [3. Integrasi Svelte](#3-integrasi-svelte)
  - [4. Integrasi Angular](#4-integrasi-angular)
- [Siklus Hidup Custom Element](#-siklus-hidup-custom-element)

---

## 🌟 Gambaran Umum

Paket `@jiwoqr/web-component` menyediakan elemen kustom native `<jiwo-qr>` yang membungkus `@jiwoqr/renderer-webgl`. 
Kelebihan Web Component:
- **Zero-Framework Overhead**: Dapat disematkan pada halaman web mana pun tanpa membutuhkan bundler atau runtime React/Vue.
- **Deklaratif**: Cukup tulis `<jiwo-qr value="..." model="globe"></jiwo-qr>` di HTML.
- **Reaktivitas Otomatis**: Setiap perubahan atribut pada DOM (`setAttribute`) langsung memicu pembaruan pada visual 3D.

---

## 📦 Instalasi & Registrasi

```bash
pnpm add @jiwoqr/web-component @jiwoqr/renderer-webgl three
```

Cukup impor paket sekali di berkas entri aplikasi Anda untuk mendaftarkan Custom Element:

```typescript
import '@jiwoqr/web-component';
```

---

## 🏷️ Atribut & Properti HTML

| Atribut | Tipe | Nilai Default | Pilihan Nilai | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `string` | `"https://jiwoqr.dev"` | Teks string atau URL apa pun | Payload yang akan di-encode ke dalam matriks QR. |
| `model` | `string` | `"architecture"` | `"architecture"`, `"globe"`, `"circuit"` | Arketipe visual 3D yang aktif. |
| `mode` | `string` | `"3d"` | `"3d"`, `"scan"` | Mode tampilan interaktif 3D atau mode pemindaian 2D datar. |

---

## ⚡ Metode JavaScript DOM

Elemen `<jiwo-qr>` mengekspos metode publik yang dapat dipanggil langsung melalui referensi DOM:

```typescript
const qr = document.querySelector<JiwoQRElement>('jiwo-qr')!;

// 1. Mengubah mode (3d atau scan) dengan animasi halus
qr.setMode('scan');

// 2. Mengubah arketipe model visual
qr.setModel('globe');

// 3. Mengontrol progress morphing secara manual (0.0 s.d. 1.0)
qr.setMorphProgress(0.75);
```

---

## 💻 Contoh Penggunaan

### 1. HTML Murni & Vanilla JavaScript

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>JiwoQR Web Component Demo</title>
  <script type="module">
    import './node_modules/@jiwoqr/web-component/dist/index.js';
  </script>
  <style>
    .qr-card {
      width: 450px;
      height: 450px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div class="qr-card">
    <jiwo-qr 
      id="my-qr"
      value="https://github.com/AlbertAZ1992/every-qrcode" 
      model="globe" 
      mode="3d">
    </jiwo-qr>
  </div>

  <button onclick="document.getElementById('my-qr').setMode('scan')">
    Mode Scan
  </button>
  <button onclick="document.getElementById('my-qr').setMode('3d')">
    Mode 3D
  </button>
</body>
</html>
```

---

### 2. Integrasi Vue 3

Di file konfigurasi Vite / Vue (`vite.config.ts`), izinkan tag kustom:
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('jiwo-'),
        },
      },
    }),
  ],
});
```

Penggunaan di komponen Vue:
```vue
<template>
  <div class="qr-wrapper">
    <jiwo-qr 
      :value="url" 
      :model="model" 
      :mode="isScan ? 'scan' : '3d'"
    ></jiwo-qr>
    
    <div class="controls">
      <button @click="isScan = !isScan">
        {{ isScan ? 'Mode 3D' : 'Mode Scan' }}
      </button>
      <button @click="model = model === 'architecture' ? 'globe' : 'architecture'">
        Ganti Model ({{ model }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import '@jiwoqr/web-component';

const url = ref('https://vuejs.org');
const model = ref('globe');
const isScan = ref(false);
</script>

<style scoped>
.qr-wrapper {
  width: 480px;
  height: 480px;
}
</style>
```

---

### 3. Integrasi Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import '@jiwoqr/web-component';

  let url = 'https://svelte.dev';
  let mode = '3d';
  let model = 'architecture';
</script>

<div style="width: 450px; height: 450px;">
  <jiwo-qr 
    value={url} 
    {model} 
    {mode}
  ></jiwo-qr>
</div>

<button on:click={() => mode = mode === '3d' ? 'scan' : '3d'}>
  Toggle Scan Mode
</button>
```

---

### 4. Integrasi Angular

Di modul Angular (`app.module.ts`), tambahkan `CUSTOM_ELEMENTS_SCHEMA`:
```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@jiwoqr/web-component';

@NgModule({
  declarations: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

Template HTML (`app.component.html`):
```html
<div style="width: 500px; height: 500px;">
  <jiwo-qr [attr.value]="qrUrl" [attr.model]="qrModel" [attr.mode]="qrMode"></jiwo-qr>
</div>
```

---

## 🔄 Siklus Hidup Custom Element

1. **`connectedCallback()`**: Membaca atribut awal (`value`, `model`, `mode`), membuat instance `JiwoWebGLRenderer`, dan memasang canvas WebGL ke shadow/host element.
2. **`attributeChangedCallback(name, oldValue, newValue)`**: Mencegat perubahan atribut secara otomatis dan mengarahkan ke metode renderer yang sesuai (`setData`, `setModel`, `setMode`).
3. **`disconnectedCallback()`**: Memanggil `renderer.dispose()` untuk membebaskan konteks WebGL dan geometri saat elemen dihapus dari dokumen.
