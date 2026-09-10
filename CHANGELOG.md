# Hotfix v1.4.1

- Memperbaiki update banner yang tetap terlihat meskipun atribut `hidden` aktif.
- Menambahkan tombol × untuk menutup notifikasi update.
- Update banner sekarang hanya muncul saat benar-benar ada service worker versi baru yang menunggu.
- Memperbaiki cache PWA agar CSS/JS versi lama tidak tertahan setelah redeploy Vercel.
- Tombol UPDATE kini menampilkan status MEMUAT… dan banner otomatis hilang saat controller baru aktif.

# Changelog

## v1.4.0

### Upgrade besar
- UI/UX mobile-first baru dengan Home Dashboard dan bottom navigation.
- Tactical Lab 2.0 dengan search/filter, copy tactic, recent tactics, tactical read, dan panel segmented.
- Match Engine 2.0 dengan scoreboard, match clock, interactive decision window, AI press movement, turnover/counter, dan hasil finishing variatif.
- Problem Solver + rekomendasi setting yang dapat diterapkan langsung ke Tactical Lab.
- Set Piece Lab interaktif.
- Controller guide di Academy.
- Profile/level/skill progression.
- Export/import backup JSON.
- PWA update banner dan cache strategy yang diperbaiki.

### Bug fixes
- Memperbaiki referensi DOM `counter` yang dapat memutus inisialisasi aplikasi setelah migrasi layout.
- Menghilangkan dependensi pada tab header lama yang sudah tidak ada.
- Menambahkan guard untuk elemen UI opsional agar perubahan layout tidak menyebabkan null reference.
- Memperbaiki alur service worker agar update tidak langsung mengganti sesi aktif tanpa pemberitahuan.
- Memperbaiki cache versioning dan membersihkan cache versi lama saat aktivasi.
- Memperbaiki sinkronisasi scoreboard saat tim/lawan berubah.
- Menambahkan reset Match Engine dan pembatalan run lama agar animasi tidak tumpang tindih.
- Menambahkan validasi import backup.
- Memastikan semua asset utama dapat disajikan sebagai static deployment tanpa build step.
