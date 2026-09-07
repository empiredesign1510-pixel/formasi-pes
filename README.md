# PES3 Coach 2026 — Web/PWA

Versi web/PWA yang siap di-push ke GitHub dan di-deploy ke Vercel.

## Fitur
- Tactical Lab
- Match Lab 11v11
- Academy Challenge
- Animasi formasi, passing, shooting, defending, set piece
- Penyimpanan favorit/XP di localStorage
- Installable PWA di Android
- Offline cache melalui Service Worker

## Struktur
```text
.
├── index.html
├── css/
│   ├── base.css
│   ├── academy.css
│   └── app.css
├── js/
│   ├── core.js
│   ├── academy.js
│   ├── ui.js
│   ├── matchlab.js
│   ├── challenge.js
│   └── pwa.js
├── assets/icons/
├── manifest.webmanifest
├── service-worker.js
├── vercel.json
└── .gitignore
```

## Coba lokal
Jangan buka lewat `file://` jika ingin mengetes PWA/service worker. Jalankan server lokal:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Push ke GitHub
```bash
git init
git add .
git commit -m "Initial PES3 Coach PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/pes3-coach-2026.git
git push -u origin main
```

## Deploy ke Vercel
1. Buka Vercel > Add New > Project.
2. Import repository GitHub `pes3-coach-2026`.
3. Framework Preset: **Other**.
4. Root Directory: `./`.
5. Build Command: kosong.
6. Output Directory: kosong.
7. Klik **Deploy**.

Setiap push berikutnya ke branch production akan memicu deploy baru otomatis.

## Install di Android
Buka URL Vercel di Chrome/Edge Android. Tombol **INSTALL APP** akan muncul ketika browser menganggap PWA siap dipasang. Jika tidak muncul, gunakan menu browser > **Install app / Tambahkan ke layar utama**.

## Catatan
Project ini tidak menyimpan token/API key. Jangan commit secret ke GitHub.
