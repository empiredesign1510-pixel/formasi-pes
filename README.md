# PES3 Coach 2026 v1.4

PWA mobile-first untuk belajar formasi, setting, simulasi taktik, pengambilan keputusan, bertahan, passing, shooting, set piece, dan counter tactic PES PS3/Gembox.

## Fitur utama v1.4

- Home Dashboard baru dengan level, XP, streak, favorit, recent tactics, dan daily challenge.
- Tactical Lab 2.0 dengan pencarian taktik, Club DNA, drag player, support/def line/compactness live, Play Tactic, favorit, copy tactic, dan tactical read.
- Match Engine 2.0 dengan scoreboard, menit pertandingan, 11v11, AI movement, decision window, turnover, counter lawan, save, block, corner, wide, dan goal probability.
- Problem Solver untuk masalah: passing sering dipotong, through ball, tiki-taka, pressing, crossing, park the bus, dan finishing.
- Set Piece Lab dengan corner near/far/short, free kick curve/power/layoff, penalty, dan panenka.
- Academy dengan challenge timing, XP/streak, controller guide, dan tutorial skill.
- Profile skill rating: Passing, Shooting, Defending, Tactical IQ.
- Backup & restore local data ke file JSON.
- PWA installable, offline shell, network indicator, dan update banner saat versi baru tersedia.
- Bottom navigation yang lebih nyaman di layar HP.

## Menjalankan lokal

Karena ada Service Worker, jangan membuka langsung dengan `file://`. Jalankan HTTP server sederhana:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Deploy GitHub → Vercel

Project ini tidak membutuhkan Node.js atau build command.

1. Push seluruh isi folder ke repository GitHub.
2. Import repository tersebut di Vercel.
3. Framework Preset: `Other`.
4. Root Directory: `./`.
5. Build Command: kosong.
6. Output Directory: kosong.
7. Deploy.

Setelah repository terhubung, setiap push ke branch production akan memicu deployment baru.

## Data

Progress disimpan di `localStorage`. Gunakan menu Coach → Profile → Export Backup sebelum membersihkan data browser atau berpindah perangkat.

## Catatan

Kontrol tutorial mengacu pada konfigurasi default/classic PES PS3. Jika tombol pada patch Gembox pengguna telah diubah, ikuti fungsi command masing-masing.
