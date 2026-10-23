# Tabungin

Tabungin adalah aplikasi menabung lokal-first untuk mencatat setoran berbukti, target tabungan, anggaran, tagihan rutin, dan kebiasaan finansial. Seluruh data dan foto bukti disimpan di perangkat, tanpa server dan tanpa akun.

## Menjalankan

```bash
npm install
npm run dev
```

## Pemeriksaan

```bash
npm run typecheck
npm run build
```

## Catatan data

- Data utama dan foto disimpan di IndexedDB browser.
- Preferensi ringan disimpan di LocalStorage.
- Cadangan JSON menyertakan metadata dan foto bukti.
- Impor tetap menerima cadangan lama dari versi sebelumnya.
