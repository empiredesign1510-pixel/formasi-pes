# Deploy Checklist

## GitHub
- [ ] Buat repository baru
- [ ] Push seluruh isi folder ini
- [ ] Pastikan branch utama bernama `main`

## Vercel
- [ ] Import repository GitHub
- [ ] Framework: Other
- [ ] Root: ./
- [ ] Deploy
- [ ] Buka URL hasil deploy

## PWA
- [ ] Buka website dari HTTPS (Vercel otomatis HTTPS)
- [ ] Reload sekali setelah deploy pertama
- [ ] Coba mode airplane setelah pernah membuka aplikasi
- [ ] Coba tombol Install App / Add to Home Screen

## Update berikutnya
```bash
git add .
git commit -m "Update PES3 Coach"
git push
```
Vercel akan deploy otomatis.
