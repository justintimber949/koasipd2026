# Koas IPD Helper

Website statis untuk shortcut harian Koas Stase IPD. Berisi link handover, KONRU, template chat per DPJP (7 DPJP real), jadwal jaga/stase/chat dosen, info stase lengkap (aturan, kontak, syarat kelulusan), favorit, dan catatan pribadi (localStorage).

## Fitur

- **7 tab**: Favorit (default), Link, Template, Jadwal, Info Stase, Catatan, Profil
- **7 DPJP real** dengan nama, nomor WA (klik untuk chat), jam visite
- **33 template chat** per DPJP (3 area FU untuk Zain/Anggaru/Astri, FU All untuk Abdur/Dyah/Iwal)
- **Auto-fill profil** — isi nama & panggilan sekali di tab Profil, otomatis terisi di template saat disalin
- **Info Stase lengkap**: kontak penting, jadwal stase & jaga, workflow harian, aturan penting, syarat kelulusan
- **Search global** untuk cari DPJP, link, atau template
- **Salin sekali klik** untuk template chat (dengan auto-replace placeholder)
- **Bookmark/favorit** untuk link & template — link favorit bisa diklik langsung, template favorit bisa disalin langsung
- **Catatan pribadi** di localStorage
- **Password gate sederhana** — masuk kode sekali, tersimpan di sessionStorage
- **Dark-first** dengan aksen cyan
- **Responsive** mobile dan desktop
- **No build step** - cukup edit file JSON, push, dan langsung tampil

## Password Gate (Akses Website)

Website diproteksi password sederhana. Saat pertama kali dibuka, akan muncul layar masuk kode akses.

- **Default password**: `koas-ipd-2026`
- **Ganti password**: edit `js/auth.js`, ubah baris `PASSWORD: 'koas-ipd-2026'` ke password yang kamu mau
- **Persistent login**: setelah masuk, tidak perlu input lagi selama tab browser tidak ditutup (pakai sessionStorage). Kalau mau persistent walau browser ditutup, ubah `STORAGE_TYPE: 'sessionStorage'` jadi `STORAGE_TYPE: 'localStorage'` di `js/auth.js`

**Catatan keamanan**: Password di static HTML bukan proteksi nyata - siapa pun bisa view source dan lihat password-nya di `js/auth.js`. Ini hanya menghindari browsing kasual, bukan mengamankan data sensitif. Untuk proteksi nyata, gunakan repository private (gratis via GitHub Student Pack).

## Deploy ke GitHub Pages

### 1. Buat repository baru di GitHub
- Nama bebas, misal: `koas-ipd-helper`
- Set **Public** (atau Private bila punya GitHub Pro)

### 2. Upload semua file ke repository
Salin seluruh isi folder ini (index.html, css/, js/, data/, assets/) ke root repository.

### 3. Aktifkan GitHub Pages
1. Buka repository di GitHub
2. Klik tab **Settings**
3. Menu kiri → **Pages**
4. Source: **Deploy from a branch**
5. Branch: **main** / folder: **/ (root)**
6. Klik **Save**
7. Tunggu 1-2 menit, website akan tersedia di:
   `https://[username].github.io/koas-ipd-helper/`

### 4. Update konten
Setelah deploy pertama, update konten cukup dengan:
1. Edit file JSON di folder `data/` (bisa langsung di GitHub web editor)
2. Commit changes
3. Tunggu 1-2 menit, refresh website

Lihat [`data/README.md`](data/README.md) untuk panduan format JSON.

## Update jadwal (PNG)

1. Letakkan file PNG di folder `assets/`
2. Update `path` di `data/schedules.json` ke nama file baru
3. Commit dan push - jadwal baru langsung tampil

## Test lokal

Karena website memakai `fetch()` untuk memuat JSON, perlu dijalankan via HTTP server (tidak bisa buka langsung file `index.html` dengan `file://`).

### Pakai Python (sudah ada di kebanyakan komputer):
```bash
cd koas-ipd-helper
python3 -m http.server 8000
```
Lalu buka `http://localhost:8000` di browser.

### Pakai Node.js (bila terinstall):
```bash
npx serve koas-ipd-helper
```

## Privacy & Security

### Link rahasia di repo public
Link Google Sheets/Doc yang dimasukkan ke `data/links.json` akan terlihat oleh siapa saja yang membuka repository GitHub. Pastikan:
- Link Google Sheets sudah diset sharing ke "Anyone with link" atau spesifik orang
- Tidak ada info pasien di file JSON (link Google Sheets itu sendiri aman, isi sheet diatur per-user)

### Catatan pribadi
- Tersimpan di localStorage browser per perangkat
- Tidak pernah diupload ke server
- Bisa hilang jika user clear browser cache - backup berkala via DevTools (lihat `data/README.md`)

### Password protection (opsional, masa depan)
Untuk menambah password gate sederhana:

1. Buat file `js/auth.js`:
```javascript
const PASSWORD_HASH = 'ganti_dengan_hash_anda';
// atau untuk simpel: const PASSWORD = 'kataSandiAnda';

if (sessionStorage.getItem('auth') !== 'ok') {
  const input = prompt('Password:');
  if (input !== 'kataSandiAnda') {
    document.body.innerHTML = '<div style="padding:2rem;text-align:center;font-family:sans-serif">Akses ditolak.</div>';
    throw new Error('Unauthorized');
  }
  sessionStorage.setItem('auth', 'ok');
}
```

2. Tambahkan `<script src="js/auth.js"></script>` di `index.html` sebelum script lainnya.

**Catatan keamanan**: Password gate di static HTML bukan proteksi nyata - siapa pun bisa view source dan lihat password-nya. Ini hanya menghindari browsing kasual, bukan mengamankan data sensitif. Untuk proteksi nyata, gunakan repository private (gratis di GitHub Pro / GitHub Student Pack).

## Stack

- HTML5 murni (no framework)
- CSS3 dengan CSS Custom Properties (variables)
- Vanilla JavaScript (ES6+, no dependencies)
- Font: Inter + JetBrains Mono via Google Fonts CDN
- Storage: localStorage (catatan & favorit)

## Lisensi

Personal use. Bebas dimodifikasi sesuai kebutuhan pribadi.
"# koasipd2026" 
