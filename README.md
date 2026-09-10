# PES3 Coach 2026 v1.5

PWA mobile-first untuk formasi, setting taktik, Match Lab 11v11, Academy, Problem Solver, Set Piece Lab, dan **Free Kick Arena** interaktif.

## Highlight v1.5 — Free Kick Arena
Free Kick Arena dibuat seperti mini-game. Pengguna mengusap layar dari bola menuju gawang dan menggambar sendiri jalur tendangan. Kecepatan swipe memengaruhi power, bentuk swipe memengaruhi curve/curl, dan arah akhir memengaruhi target. Arena memiliki pagar pertahanan, kiper dengan tingkat kemampuan berbeda, wind, post/crossbar, goal detection, score, combo, grade, challenge, replay, dan round rating.

Tidak dibutuhkan library game eksternal. Gameplay menggunakan Canvas API + Pointer Events sehingga dapat dimainkan dengan touch di Android maupun mouse/pen di desktop.

## Cara menjalankan lokal
Gunakan local HTTP server agar Service Worker/PWA berfungsi.

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Deploy GitHub → Vercel
Upload **isi folder ini** ke root repository GitHub, sehingga `index.html` berada langsung di root repository. Di Vercel gunakan Framework Preset `Other`; build command dan output directory dapat dikosongkan.

## Struktur penting
- `index.html` — shell aplikasi dan semua page.
- `css/free-kick.css` — UI Free Kick Arena.
- `js/free-kick.js` — gesture, trajectory, goalkeeper AI, scoring, challenge, dan canvas renderer.
- `service-worker.js` — offline cache/PWA.
- `manifest.webmanifest` — metadata instalasi PWA.

## Data lokal
Free Kick menyimpan best score, challenge aktif, XP internal, dan setting sound di `localStorage`. Data existing Tactical Lab/Academy tetap dipertahankan.
