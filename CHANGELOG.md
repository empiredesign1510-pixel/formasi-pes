# Changelog

## v1.5.0 — Free Kick Arena

### New game mode
- Free Kick Arena berbasis gesture/swipe layar.
- Pengguna memulai usapan dari bola lalu menggambar arah tendangan sendiri.
- Gesture memengaruhi power, curl/curve, target kiri-kanan, dan ketinggian tendangan.
- Jalur gesture divisualisasikan langsung di arena.
- Bola dianimasikan mengikuti karakter gesture, termasuk pengaruh angin ringan.
- Ilustrasi pemain penendang, pagar hidup, kiper, gawang, net, stadion, dan bola dibuat langsung di canvas.
- Animasi run-up/kick, pagar melompat, kiper diving, trajectory/trail, serta feedback hasil.

### Shot outcomes
- Goal.
- Top Bins bonus.
- Great Save.
- Hit the Post / Crossbar.
- Blocked by Wall.
- Wide / Over.

### Scoring & progression
- 5 bola per round.
- Score, best score, combo multiplier, goals, saves, post, dan wall counter.
- Grade per tendangan: S/A/B/C/D.
- Power, Curve, dan Accuracy meter.
- Challenge rotation: Pemanasan, Bend It, Top Bins, Wall Breaker, Clutch Combo, Points Hunter.
- Round result dengan 1–3 stars dan rating.
- Progress/high score/challenge disimpan di localStorage.

### Gameplay options
- Difficulty: Rookie, Pro, Legend.
- Distance: 18m, 22m, 27m, 30m.
- Dynamic wind.
- Replay last path.
- Sound toggle dan vibration feedback bila perangkat mendukung.

### UI/UX
- Free Kick Arena card di Home.
- CTA Free Kick Arena di Academy.
- Halaman mobile-first khusus Free Kick dengan HUD game-style.
- Gesture guide dan contextual Coach Tip.

### PWA
- Cache dinaikkan ke `pes3-coach-v1-5-pwa-1`.
- `free-kick.css` dan `free-kick.js` dimasukkan ke app shell.
- Manifest shortcut Free Kick Arena ditambahkan.
- Hotfix update banner v1.4.1 tetap dipertahankan.
