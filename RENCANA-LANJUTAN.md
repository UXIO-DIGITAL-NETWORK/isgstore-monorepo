# Rencana Lanjutan — `isgstore-monorepo` (situs klien pertama, LIVE)

Handover untuk dilanjutkan besok. Repo ini **belum menerima apa pun** dari pekerjaan cetakan; ia masih berjalan seperti sebelumnya (commit terakhir `8d01d4ae`).

## Konteks

Cetakan (`web-topup-monorepo`) sekarang punya colokan, stempel versi, dan pipeline rilis-tag. Semua itu masih **hanya di cetakan** (branch `development`, belum di `main`). Repo ini adalah klien pertama, jadi ia yang pertama harus mengadopsinya — **tetapi tidak buru-buru**, karena produksi sedang jalan.

Aturan pembagian kerja: [docs/07-zona-dapur.md ↗](https://github.com/UXIO-DIGITAL-NETWORK/web-topup-monorepo/blob/development/docs/07-zona-dapur.md). Yang boleh beda per situs: UI, alur, provider top-up, payment gateway, kanal notifikasi. Yang tidak boleh: engine transaksi + cara lapor ke Hub.

## Langkah lanjutan besok (urut, dan jangan dibalik)

1. **Perbaiki dulu 3 berkas yang gagal Pint** — `GoogleLoginAction`, `ReverseMerchantSettlementAction`, `MarketingController`. Ini drift bawaan yang juga ikut ke cetakan, dan **CI repo ini kemungkinan sedang merah** di langkah `pint --test`. Jalankan `./vendor/bin/pint` di `apps/api`, commit.
2. **Tarik pekerjaan cetakan** dari branch `development`:
   ```bash
   git remote add upstream git@github.com:UXIO-DIGITAL-NETWORK/web-topup-monorepo.git   # sekali
   git fetch upstream --tags
   git merge upstream/development
   ```
   **Konflik yang diharapkan: berkas merek.** Cetakan memakai merek netral; repo ini harus tetap **"ISG Store"**. Selesaikan konflik ke arah repo ini (jangan ikut menetralkan), lalu periksa `useBranding.ts`, `locales/*/auth.json`, `index.html`, `CLAUDE.md`, `README.md`, `.mcp.json`, `docs/04-deployment.md`.
3. **Jalankan CI** di branch (bukan `main`) dan pastikan keempat job lulus sebelum menyentuh `main`.
4. **Higiene yang sama seperti cetakan**: hapus workflow lama mati di `apps/*/.github/workflows/`, lepas `__pycache__/*.pyc` dari git + tambahkan pola abaikannya.
5. Setelah semua hijau: **perbarui `.env` produksi ke `UXIOTOPUP_*`** bila masih memakai `UXIOLABS_*` — nama lama tidak dibaca, dan setiap pesanan akan gagal di supplier. Periksa halaman Integration di panel admin untuk melihat mana yang berlaku.
6. **Jangan** pindahkan produksi ke model tag dulu. Itu langkah terakhir, setelah staging situs ini berdiri (lihat `docs/04` di cetakan, bagian Staging).

## Peringatan

- **Merek klien wajib tetap "ISG Store"** di semua merge dari cetakan.
- **Jangan merge ke `main`** of this repo sebelum CI hijau — produksi ikut naik saat `main` dipush sampai model tag diaktifkan.
- Situs ini **gelap secara default** bila `HUB_MANAGED_LICENCE` aktif dan Hub belum menjawab "serving".
