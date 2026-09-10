# Deploy v1.5 ke GitHub + Vercel

1. Extract ZIP project.
2. Upload seluruh **isi** folder project ke root repository GitHub. Pastikan `index.html`, `service-worker.js`, `css/`, dan `js/` tidak berada di subfolder tambahan.
3. Commit perubahan, misalnya `Upgrade PES3 Coach to v1.5 Free Kick Arena`.
4. Jika repository sudah terhubung ke Vercel, deployment baru berjalan otomatis.
5. Jika belum, Vercel → Add New → Project → Import repository → Framework `Other` → Deploy.
6. Setelah deployment selesai, buka website satu kali dengan koneksi internet agar app shell v1.5 masuk cache PWA.
7. Bila browser masih menampilkan cache lama, reload. Sistem Service Worker v1.4.1+ akan menawarkan update hanya ketika worker baru benar-benar tersedia.

Tidak ada environment variable, database, npm install, atau build command yang dibutuhkan untuk v1.5.
