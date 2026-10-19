# 📸 Gallery Inhistoria — Client Photo Selection Web App

Aplikasi web modern untuk fotografer **Inhistoria Photography** guna membagikan foto ke klien untuk proses kurasi / pemilihan foto (*photo selection*). Klien dapat membuka galeri dari **HP atau laptop mana saja**, mereview foto satu per satu secara *full-screen*, memilih foto sesuai batas kuota, dan langsung mengirimkan daftar kode foto terpilih ke WhatsApp fotografer dalam hitungan detik!

---

## ✨ Fitur Unggulan

1. **Dashboard Khusus Fotografer (`dashboard.html`)**:
   - Input **Nama Klien** (misal: `DIANA - UIN`).
   - Input **Link Google Drive Folder** (otomatis mendeteksi ID folder).
   - Tombol **"Cek & Hitung Foto"** untuk memastikan folder Google Drive dapat diakses dan menghitung jumlah foto sebelum link dibuat.
   - Atur **Batas Maksimal Foto** (misal: 20 foto, tersedia preset cepat 10, 15, 20, 25, 30, 50).
   - Input **Nomor WhatsApp Studio** (tersimpan otomatis untuk menerima rekap).
   - Generator **Link Khusus Klien** + **Kode QR** (bisa langsung discan klien saat sesi foto/wisuda).
   - Riwayat project tersimpan di browser Anda.

2. **Galeri Interaktif untuk Klien (`gallery.html`)**:
   - **Tampilan Elegan & Responsif**: Nyaman dibuka di HP (iPhone/Android), tablet, dan PC.
   - **Mode Review / Lightbox Full-screen**: Klik foto untuk melihat detail resolusi tinggi, dilengkapi tombol ganti foto (*swipe* jari di HP atau panah keyboard di laptop).
   - **Tombol Pilih Cepat**: Checklist di sudut foto atau langsung di dalam lightbox.
   - **Proteksi Batas Kuota**: Indikator *real-time* (misal `12 / 20 Foto Dipilih`). Jika kuota 20 sudah tercapai, sistem secara ramah mencegah pemilihan foto ke-21 kecuali klien membatalkan salah satu foto.
   - **Autosave di HP Klien**: Jika tab browser klien tertutup atau baterai habis, pilihan foto tidak akan hilang!

3. **Rekapitulasi & Integrasi Fotografer**:
   - **Kirim ke WhatsApp (1-Klik)**: Menyusun pesan otomatis berisi Nama Klien, Jumlah Foto, dan Nomor Urut Kode Foto (misal `DSC01923.JPG`, `INH_0195.JPG`).
   - **Format Lightroom Search**: Menghasilkan daftar nama file koma (`DSC01923, DSC01925, ...`) sehingga fotografer tinggal *paste* ke kolom pencarian Adobe Lightroom / Bridge / Capture One untuk langsung memfilter foto pilihan klien!
   - **Unduh File TXT**: Download ringkasan pilihan ke file teks.

---

## 🚀 Mengapa Bisa "Tanpa Hosting Berbayar" dan "Tanpa Apps Script"?

| Masalah Konvensional | Solusi Gallery Inhistoria |
|---|---|
| **Sewa hosting berbayar & domain** (Rp 50rb - 100rb/bulan) | **100% Gratis Selamanya** menggunakan hosting static modern seperti **Vercel**, **Netlify**, atau **GitHub Pages**. |
| **Google Apps Script** lambat (*cold start* 5-10 detik), kuota sering habis, dan URL berantakan | Murni **Client-Side SPA** (HTML, CSS, JS) + **Google Drive API v3**. Sangat cepat, tanpa jeda loading, dan tanpa banner peringatan Google. |
| **Perlu setup database rumit** | Konfigurasi project (Nama Klien, Batas Foto, Folder ID) di-encode aman langsung ke dalam URL khusus. |

---

## 🛠️ Langkah-Langkah Deploy Gratis (Pilih Salah Satu)

### Opsi 1: Deploy ke Vercel (Paling Direkomendasikan & Sangat Cepat)
1. Buat akun gratis di [vercel.com](https://vercel.com).
2. Install Vercel CLI di terminal atau upload folder `gallery-inhistoria` ke GitHub / drag-and-drop ke dashboard Vercel.
3. Anda langsung mendapatkan domain gratis seperti `https://gallery-inhistoria.vercel.app` yang siap digunakan selamanya.

### Opsi 2: Deploy ke GitHub Pages (100% Gratis)
1. Buat repository baru di [github.com](https://github.com) bernama `gallery-inhistoria`.
2. Upload semua file dalam folder ini ke repository tersebut.
3. Masuk ke **Settings** repository &rarr; **Pages** &rarr; pilih branch `main` &rarr; klik **Save**.
4. Website Anda langsung aktif di `https://username.github.io/gallery-inhistoria/`.

### Opsi 3: Buka Langsung di Laptop / Komputer (Offline/Local)
- Cukup klik dua kali (double-click) file `dashboard.html` di komputer Anda, maka sistem langsung berjalan di Google Chrome / Safari / Edge!

---

## 🔑 Cara Mendapatkan Google Drive API Key Gratis (Hanya 2 Menit)

Aplikasi ini menggunakan Google Drive API v3 resmi dari Google untuk membaca foto dari folder publik tanpa meminta klien login:

1. Buka [Google Cloud Console](https://console.cloud.google.com/) (masuk dengan akun Google Anda, 100% gratis).
2. Klik dropdown project di atas &rarr; klik **New Project** &rarr; beri nama misalnya `Inhistoria Gallery` &rarr; klik **Create**.
3. Di bilah pencarian atas, ketik **"Google Drive API"** &rarr; klik hasil pencarian &rarr; klik tombol **Enable** (Aktifkan).
4. Masuk ke menu **Credentials** (Kredensial) di sisi kiri &rarr; klik **Create Credentials** &rarr; pilih **API Key**.
5. Salin (copy) kode API Key yang muncul (berawalan `AIzaSy...`).
6. Buka `dashboard.html` &rarr; klik tombol **"API Key G-Drive"** di pojok kanan atas &rarr; paste API Key Anda &rarr; klik **Simpan Pengaturan**.

> **Penting untuk Folder Google Drive:**  
> Pastikan folder foto di Google Drive diatur hak aksesnya menjadi:  
> **"Siapa saja yang memiliki link dapat melihat"** (*Anyone with the link can view*).

---

## 💡 Cara Pakai (Workflow Fotografer & Klien)

```
[Fotografer]
Upload Foto ke G-Drive ➔ Buka Dashboard ➔ Masukkan "DIANA - UIN", Link Drive, Batas 20 ➔ Klik Buat Project
                                      │
                                      ▼
                        Dapatkan Link Khusus Klien
                                      │
                                      ▼
[Klien]
Buka Link di HP ➔ Review Foto Fullscreen ➔ Pilih Maksimal 20 Foto ➔ Klik "Kirim ke WhatsApp"
                                      │
                                      ▼
[Fotografer Menerima WA]
Daftar Nomor Foto & Kode Pencarian Lightroom Siap Diedit!
```

---

## 📁 Struktur Folder Project

```
gallery-inhistoria/
├── index.html           # Pengarah otomatis (redirector ke dashboard / gallery)
├── dashboard.html       # Dashboard Fotografer (input client, link drive, batas)
├── gallery.html         # Halaman Gallery Pemilihan Foto Klien (mobile-first)
├── vercel.json          # Konfigurasi deploy Vercel
├── README.md            # Dokumentasi lengkap
└── assets/
    ├── css/
    │   └── style.css    # Gaya fotografi gelap, kartu foto, & lightbox
    └── js/
        ├── app.js       # Utility: encoder URL, format WA, toast notifikasi
        ├── drive.js     # Integrasi Google Drive API v3 & mode demo
        ├── dashboard.js # Logika dashboard & generator link/QR
        └── gallery.js   # Logika interaksi galeri klien, swipe, & limit
```
