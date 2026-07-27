# Ringkasan Perbaikan & Fitur Dashboard TIK

Dokumen ini berisi daftar perubahan, perbaikan bug, dan fitur baru yang telah diterapkan pada sistem Dashboard TIK.

## ✅ Perbaikan Bug (Fixes)

### Keamanan (Security)
- **JWT Secret**: Menghapus password rahasia default (hardcoded). Server sekarang akan **berhenti otomatis** jika `JWT_SECRET` tidak diisi di file `.env`. Ini mencegah celah keamanan serius.
- **CORS**: Membatasi akses API hanya dari domain frontend yang diizinkan (default: `localhost:5173`) melalui variabel `FRONTEND_URL`.
- **Auth Consistency**: Memastikan semua rute sensitif di server (Sharing, Disk, Acak Duduk) terlindungi oleh `authMiddleware`.

### Stabilitas (Stability)
- **Anti-Crash Storage**: Menambahkan sistem *fallback* jika database pengaturan masih kosong. Server tidak akan crash saat mencoba mengakses `baseDir`.
- **Windows File Move**: Mengganti fungsi `fs.rename` menjadi `copyFile` + `unlink`. Ini mencegah error "EXDEV" saat memindahkan file antar drive (misal dari C: ke D:) pada sistem Windows.
- **JSON Parser**: Menambahkan `try-catch` saat membaca data user dari `localStorage` di client untuk mencegah layar putih (crash) jika data rusak.

### Navigasi
- **Route Sync**: Menghubungkan menu Sidebar (Sharing & Local Disk) ke halaman nyata. Sebelumnya hanya berupa teks "Coming Soon".
- **Auto Redirect**: Jika user belum login dan mencoba akses dashboard, sistem akan melempar (*redirect*) balik ke halaman login secara bersih menggunakan React Router.
- **401 Auto Logout**: Jika token login habis, sistem otomatis menghapus sesi lokal dan meminta user login ulang.

---

## 🌟 Fitur Baru & Peningkatan UX

### Login Siswa (Advanced Filter)
- **Alur Login Baru**: Siswa tidak lagi mencari nama di satu daftar panjang. Sekarang urutannya:
  1. Pilih **Kelas**.
  2. Pilih **Rombel** (muncul setelah kelas dipilih).
  3. Cari/Ketik nama di kolom **Search**.
  4. Pilih **Nama Siswa** (yang sudah terfilter).
  5. Masukkan **Password** (Tanggal Lahir).
- **Live Search**: Input pencarian nama siswa di halaman login untuk mempercepat proses.

### Dashboard Siswa (Real-Time Data)
- **Data Nyata**: Menghubungkan statistik (Total Tugas, Selesai, Belum Selesai) ke database melalui API.
- **Tugas Mendatang**: Menampilkan 3 tugas terbaru yang belum dikerjakan langsung di halaman depan siswa.

### Halaman Sharing & Disk (Implementation)
- **File Sharing**: Guru sekarang bisa memilih banyak file, memberi nama folder, dan mendapatkan link sharing internal.
- **Local Disk Status**: Menampilkan info direktori penyimpanan server dan waktu modifikasi terakhir.

---

## 🚀 Panduan Persiapan Launch

### 1. Konfigurasi Environment (`server/.env`)
Pastikan file `.env` di dalam folder `server` sudah diatur:
```env
PORT=5000
JWT_SECRET=GANTI_DENGAN_RANDOM_KARAKTER_PANJANG
FRONTEND_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
```

### 2. Jalankan Perintah Setup
```bash
# Masuk ke folder root
cd Dashboard-TIK

# Install semua dependensi
npm run install-all

# Setup database (Lakukan ini jika pertama kali atau reset)
npm run migrate-db
npm run seed-db

# Jalankan aplikasi (Client + Server)
npm run dev
```

---
*Sistem Dashboard TIK sekarang dalam kondisi stabil dan siap digunakan.*
