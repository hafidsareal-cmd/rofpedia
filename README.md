# Rofpedia — Full Project

Platform nonton anime sub indo dengan scraper otakudesu.blog.

---

## Struktur File

```
rofpedia-full/
├── index.html              ← Homepage (hero, ongoing, complete, schedule, genre filter)
│
├── css/
│   ├── base.css            ← CSS variables, reset, typography, animasi
│   └── components.css      ← Semua komponen UI (nav, hero, cards, modal, player, dll)
│
├── js/
│   ├── api.js              ← Semua fetch ke backend Go (localhost:8080)
│   ├── ui.js               ← Utility: skeleton, toast, debounce, localStorage helpers
│   ├── cards.js            ← HTML builder: makeCard, makeSearchResult, buildModalHTML
│   └── app.js              ← Main controller: hero, modal, player, search, genre
│
├── pages/
│   ├── ongoing.html        ← Daftar ongoing + pagination
│   ├── complete.html       ← Daftar tamat + pagination
│   ├── schedule.html       ← Jadwal tayang per hari (grid card)
│   ├── az.html             ← Index A–Z + jump nav
│   └── genre.html          ← Browser genre dengan kartu visual
│
└── README.md
```

---

## Setup & Jalankan

### 1. Backend Go (wajib)

Masukkan `main.go` dan `go.mod` dari folder `rofpedia/` (file terpisah) ke sebuah folder:

```bash
mkdir rofpedia-backend && cd rofpedia-backend
# taruh main.go dan go.mod di sini
go mod tidy
go run .
```

Server berjalan di **http://localhost:8080**

API endpoints yang tersedia:
| Endpoint | Fungsi |
|---|---|
| `GET /api/health` | Cek status server |
| `GET /api/home` | Feed homepage (ongoing + complete) |
| `GET /api/schedule` | Jadwal rilis mingguan |
| `GET /api/ongoing?page=N` | Daftar ongoing dengan pagination |
| `GET /api/complete?page=N` | Daftar tamat dengan pagination |
| `GET /api/search?q=...` | Cari anime |
| `GET /api/anime?url=...` | Detail anime + list episode |
| `GET /api/episode?url=...&resolve=0\|1` | Detail episode + stream URL |
| `GET /api/genres` | Daftar semua genre |
| `GET /api/genre?slug=action&page=1` | Anime per genre |
| `GET /api/az` | Index A–Z |

### 2. Frontend

Karena menggunakan ES Modules (`type="module"`), **tidak bisa dibuka langsung sebagai file** (`file://`).
Perlu HTTP server lokal:

```bash
# Python (sudah built-in di Python 3)
cd rofpedia-full
python3 -m http.server 3000

# Node.js (npx)
npx serve .

# Go (dari folder backend, static files juga di-serve di /)
# Sudah built-in — cukup taruh rofpedia-full/ sebagai static folder
```

Buka: **http://localhost:3000**

---

## Catatan Teknis

- **ES Modules** — semua JS pakai `import/export`, tidak butuh bundler.
- **CORS** — backend Go sudah set `Access-Control-Allow-Origin: *`.
- **localStorage** — My List dan history ditonton disimpan di browser.
- **resolve=1** di endpoint episode — aktifkan unpacking JS untuk dapat direct HLS/MP4 URL (lebih lambat ~5s).
- Poster image di-proxy oleh otakudesu, kadang butuh header Referer yang benar — kalau gagal load, tampil fallback SVG.

---

## Tambahan yang Bisa Dibangun

- [ ] Halaman profil user + My List lengkap
- [ ] Rating/komentar lokal (IndexedDB)
- [ ] Download manager (batch download)
- [ ] Notifikasi episode baru (Service Worker + Push)
- [ ] Mode offline (cache Service Worker)
- [ ] PWA manifest + install prompt
