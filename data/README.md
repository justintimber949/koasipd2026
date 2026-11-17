# Panduan Edit Data

Website ini membaca konten dari file JSON di folder `data/`. Anda tidak perlu menyentuh HTML/JS - cukup edit JSON, push ke GitHub, dan perubahan langsung tampil di website.

> **Penting**: Saat mengedit JSON, pastikan tanda koma `,` dan kurung kurawal `{}` tetap valid. Test dulu di [jsonlint.com](https://jsonlint.com/) bila ragu.

---

## File data

| File | Isi |
|---|---|
| `links.json` | Link handover, SOP KONRU, dan spreadsheets ruangan |
| `dpjps.json` | 7 DPJP + 5 template chat per DPJP + catatan preferensi |
| `schedules.json` | Path gambar PNG jadwal (jaga, stase, chat dosen) |
| `info-stase.json` | Kontak penting, jadwal, workflow, aturan, syarat kelulusan, referensi |

---

## 1. `links.json` - Daftar link handover & KONRU

Struktur punya 3 bagian utama:

### `handover`
Array link handover. Tambah/edit seperti contoh:
```json
{
  "id": "handover-xyz",
  "judul": "Handover XYZ",
  "keterangan": "Deskripsi singkat",
  "url": "https://docs.google.com/..."
}
```
- `id`: unik, bebas, tanpa spasi
- `judul`: tampil di kartu
- `keterangan`: opsional
- `url`: link Google Sheets/Doc

### `konruDoc`
Array link dokumen SOP KONRU. Struktur sama dengan handover.

### `gedung`
Array gedung, masing-masing punya array `ruangan`:
```json
{
  "nama": "Gedung Lama",
  "ruangan": [
    { "id": "krisan", "judul": "Krisan", "url": "..." },
    { "id": "edelweis-a", "judul": "Edelweis A", "locked": true }
  ]
}
```
- `locked: true` menandai ruangan tidak punya akses (tampil dengan ikon gembok, tidak bisa diklik)

---

## 2. `dpjps.json` - Daftar DPJP & template chat

Struktur:
```json
{
  "dpjps": [
    {
      "id": "dr-zain",
      "nama": "dr. Zainuddin, Sp. PD",
      "spesialisasi": "Kepala Departemen IPD - Supervisor",
      "wa": "082232789836",
      "visite": "09.00-10.00 (sering); ±11.00 bila poli ramai",
      "catatan": [
        "Soft-spoken, baik, tapi perfeksionis",
        "Banyak bertanya & dicecar - WAJIB belajar kasusnya sebelum maju"
      ],
      "templates": [
        {
          "id": "zain-pagi",
          "scenario": "followup-pagi",
          "judul": "Follow up pagi",
          "isi": "Teks template..."
        }
      ]
    }
  ]
}
```

### Field per DPJP
- `id`: unik (e.g. `dr-zain`)
- `nama`: nama lengkap dengan gelar
- `spesialisasi`: subspesialisasi atau peran (tampil sebagai subtitle)
- `wa`: nomor WhatsApp (otomatis jadi link wa.me, klik langsung chat)
- `visite`: jam visite (opsional, tampil sebagai badge di kartu DPJP)
- `catatan`: array of strings, preferensi/hal penting yang harus diingat (tampil dengan border oranye)
- `templates`: array 5 template (atau berapa pun)

### Skenario yang didukung
ID `scenario` harus salah satu dari:
- `followup-pagi` - Follow up pasien pagi
- `followup-sore` - Follow up pasien sore
- `naik-jaga` - Handover naik jaga
- `turun-jaga` - Handover turun jaga
- `konsul` - Kirim konsul

### Format teks template
- Gunakan `\n` untuk pindah baris baru
- Gunakan placeholder dalam kurung siku `[NAMA_PASIEN]` untuk info yang akan diisi sebelum kirim
- Format akan tampil dengan font monospace (JetBrains Mono) supaya struktur terlihat jelas
- Untuk DPJP dengan preferensi khusus (e.g. dr. Ferdi: CPPT tidak via WA), tulis reminder di awal isi template

### Cara nambah template baru
Salin blok template yang ada, ganti `id` jadi unik, isi `scenario`, `judul`, dan `isi`. Jangan lupa koma antar item.

---

## 3. `schedules.json` - Path gambar jadwal

Struktur ada 3 kategori: `jaga`, `stase`, `chatDosen`. Setiap kategori berisi array gambar:
```json
{
  "jaga": [
    {
      "judul": "Jadwal Jaga November 2026",
      "keterangan": "Update terakhir: 1 November 2026",
      "path": "assets/jadwal-jaga.png"
    }
  ]
}
```

### Cara update jadwal baru
1. Simpan file PNG di folder `assets/` (folder sejajar dengan folder `data/`)
2. Update `path` di `schedules.json` ke nama file baru
3. Bisa juga tambah entry baru (multi-image per kategori) - urutan mengikuti urutan di array

### Tips screenshot PNG
- Resolusi minimal 1080px lebar
- Format PNG (bukan JPG) supaya teks tetap tajam
- Crop hanya bagian jadwal, jangan include header browser

---

## 4. `info-stase.json` - Info stase, aturan, kontak

File ini berisi semua info penting yang ditampilkan di tab "Info Stase". Struktur:

```json
{
  "kontakPenting": [
    { "nama": "dr. Zainuddin, Sp. PD", "peran": "Kepala Departemen", "kontak": "082232789836" }
  ],
  "jadwalStase": [
    { "judul": "Ruangan (Senin-Jumat)", "isi": "05.00-14.00" }
  ],
  "jadwalJaga": [
    { "judul": "Jaga Weekday", "isi": "14.00-06.00" }
  ],
  "workflowHarian": [
    { "jam": "04.30-05.00", "aktivitas": "Konruan ↔ ruangan" }
  ],
  "aturanPenting": [
    { "judul": "CPPT WAJIB DI TTD", "isi": "..." }
  ],
  "aturanJaga": [
    { "judul": "Konsul pasien", "isi": "..." }
  ],
  "syaratKelulusan": [
    { "judul": "POMR", "isi": "Minimal 10..." }
  ],
  "referensi": [
    { "judul": "KDIGO", "untuk": "Ginjal" }
  ]
}
```

### Section yang ada
- `kontakPenting` - Daftar DPJP & admin (otomatis jadi link WA)
- `jadwalStase` - Jadwal ruangan/poli (grid 2 kolom dengan jadwalJaga)
- `jadwalJaga` - Jadwal shift jaga
- `workflowHarian` - Aktivitas per jam
- `aturanPenting` - Aturan stase (border accent)
- `aturanJaga` - Aturan khusus saat jaga
- `syaratKelulusan` - POMR, MR, Jurding, Referat, Mini-CEX, DOPS, OSLER
- `referensi` - Buku/panduan referensi

### Edit kontak
Untuk menambah/ubah kontak, edit array `kontakPenting`. Nomor akan otomatis dikonversi jadi link WhatsApp.

---

## Tips Edit di GitHub langsung

1. Buka file JSON di GitHub
2. Klik ikon pensil (✏️) di kanan atas
3. Edit langsung di editor GitHub
4. Klik "Commit changes"
5. Tunggu 1-2 menit, GitHub Pages akan otomatis rebuild
6. Refresh website - perubahan langsung tampil

### Backup catatan pribadi
Catatan tersimpan di localStorage browser (per perangkat). Untuk backup:
1. Buka tab "Catatan"
2. Buka Developer Tools (F12) → Console
3. Ketik: `copy(JSON.stringify(JSON.parse(localStorage.getItem('koas-ipd:notes')), null, 2))`
4. Paste ke file `.json` di komputer

### Backup favorit
Sama dengan backup catatan, ganti key jadi `koas-ipd:favorites`.
