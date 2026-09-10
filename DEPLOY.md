# Deploy ke GitHub dan Vercel

## GitHub

```bash
git init
git add .
git commit -m "PES3 Coach v1.4"
git branch -M main
git remote add origin https://github.com/USERNAME/pes3-coach-2026.git
git push -u origin main
```

## Vercel

Import repository GitHub di Vercel lalu gunakan:

- Framework Preset: Other
- Root Directory: ./
- Build Command: kosong
- Output Directory: kosong

## Update berikutnya

```bash
git add .
git commit -m "Update PES3 Coach"
git push
```

Vercel akan redeploy otomatis. Service Worker v1.4 akan mendeteksi versi baru dan menampilkan tombol UPDATE kepada pengguna PWA saat worker baru siap.
