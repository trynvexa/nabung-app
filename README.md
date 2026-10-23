# Tabungin 🐱💰

Tabungin adalah aplikasi pencatat tabungan dan keuangan pribadi yang dirancang **local-first**, intuitif, dan privat. Dilengkapi dengan bukti foto setoran, target tabungan fleksibel, pemisahan multi-dompet, anggaran bulanan, tagihan rutin, tantangan menabung, serta opsi sinkronisasi cloud dengan Supabase.

---

## Fitur Utama

- **Lokal-First & Privat**: Data disimpan di IndexedDB browser Anda. Cepat, bekerja secara offline, dan tanpa pelacakan pihak ketiga.
- **Setoran Berbukti Foto**: Lampirkan foto struk ATM atau bukti transfer pada setiap setoran, dengan kompresi cerdas dan validasi berkas aman.
- **Target & Progres Tabungan**: Tetapkan target spesifik (misal: Liburan, Dana Darurat, Gadget) dengan estimasi waktu capai dan animasi perayaan konfeti.
- **Multi-Dompet & Anggaran**: Pisahkan saldo tunai, bank, dan e-wallet. Pantau limit pengeluaran bulanan per kategori.
- **Pengingat Tagihan & Streak Menabung**: Jangan lewatkan jatuh tempo tagihan listrik/internet dan pertahankan streak menabung harian.
- **Panduan Fitur Interaktif**: Tur interaktif bagi pengguna baru untuk memahami seluruh kemampuan aplikasi.
- **Keamanan & Rate Limiting**: Perlindungan anti-brute force, sanitasi input, dan validasi tipe berkas biner.
- **Sinkronisasi Cloud Opsional (Supabase)**: Kemudahan sinkronisasi dua arah dan cadangan data ke akun Supabase pribadi Anda.

---

## Menjalankan Proyek

```bash
# Instal dependensi
npm install

# Jalankan development server
npm run dev
```

Buka peramban di `http://localhost:5173`.

---

## Pemeriksaan & Build

```bash
# Pemeriksaan tipe TypeScript
npm run typecheck

# Build produksi
npm run build
```

---

## Konfigurasi Sinkronisasi Cloud (Opsional)

Aplikasi secara bawaan berjalan 100% lokal tanpa memerlukan server. Jika Anda ingin menghubungkan Supabase untuk pencadangan cloud:

1. Salin file template lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari dashboard proyek [Supabase](https://supabase.com).
3. Buka **SQL Editor** di dashboard Supabase Anda, lalu jalankan seluruh query dari file [`supabase/schema.sql`](supabase/schema.sql).
4. Menu **Sinkronisasi Cloud Supabase** pada halaman Pengaturan akan aktif secara otomatis.

---

## Ekspor & Impor Cadangan

- **JSON Backup**: Cadangan portabel lengkap menyertakan seluruh data finansial dan foto bukti setoran.
- **Ekspor CSV**: Unduh transaksi atau riwayat setoran dalam format spreadsheet.
- Kompatibel dan menerima cadangan dari versi terdahulu.

