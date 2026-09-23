# 07 — Zona: dapur, colokan, pendengar, hiasan

Dokumen ini menjawab satu pertanyaan yang menentukan biaya merawat banyak situs:
**bagian mana yang wajib sama di semua situs, dan bagian mana yang bebas?**

Situs di-deploy per klien, dan tiap klien boleh beda — UI, halaman, alur, provider
top-up, payment gateway, layanan tambahan. Tapi ada satu lapisan yang **tidak boleh
beda**: transaksi dan cara situs melapor ke Uxio Hub. Kalau lapisan itu berbeda-beda,
setiap perbaikan harus dikerjakan ulang di tiap situs.

Istilah di bawah dipakai sebagai kosakata bersama. Pakai kata yang sama saat
berdiskusi agar tidak ada yang menebak-nebak.

## Peta zona

| Zona | Isi | Aturan |
|---|---|---|
| **Dapur** | engine transaksi & aturan bisnis, cara lapor ke Hub (`/v1/hub/*`, `HubClient`), integrasi payment inti | **Wajib sama.** Perubahan hanya lewat cetakan (`web-topup-monorepo`). |
| **Colokan** | provider top-up, payment gateway | **Boleh beda** per situs, tapi wajib ikut bentuk standar (lihat bawah). |
| **Pendengar** | WhatsApp, email, sosmed, Discord | **Boleh beda.** Hanya mendengarkan "pengeras suara" (event). |
| **Hiasan** | UI, halaman, alur tampilan, brand, domain, konten/i18n | **Bebas.** Kerjakan langsung di situs. |

## Sebelum mengubah apa pun: satu pertanyaan

> **Ini dapur atau isian?**

Jawabannya menentukan **di mana** perubahan dikerjakan — bukan sekadar rapi, tapi
supaya perbaikan sampai ke semua situs yang membutuhkannya.

| Perubahan | Cukup di situs itu | Wajib dari cetakan → semua situs |
|---|---|---|
| Bug transaksi / cara lapor Hub | | ✓ |
| Perbaikan keamanan | | ✓ |
| Perbaikan halaman template (dipakai semua situs) | | ✓ |
| Tambah titik sambungan baru | | ✓ |
| Ganti provider top-up satu klien | ✓ | |
| Tambah WhatsApp/email/sosmed satu klien | ✓ | |
| Ubah UI/branding/alur satu klien | ✓ | |

Aturan praktis: kalau perbaikan itu **relevan untuk lebih dari satu situs**, dia
bukan milik satu situs — kerjakan di cetakan.

## Colokan: dapur tahu "bentuk", bukan "merek"

Provider dan payment gateway berbeda-beda, dan itu **tidak boleh** mengubah dapur.
Dapur tidak pernah mengetahui nama provider; dapur hanya tahu bentuk data yang
dipertukarkan.

- Perbedaan provider (kode produk, field khusus, alur status) tinggal **di dalam
  colokan**, bukan di dapur.
- Data khusus yang tidak dimengerti dapur ditaruh di **kantong serbaguna** (field
  opsional yang diteruskan apa adanya), bukan ditanam sebagai kolom di dapur.
- **Dilarang** menulis percabangan `if (provider == 'A') ... else if (provider == 'B')`
  di dalam dapur. Kalau itu muncul, tarik ke colokan.

## Pendengar: dapur berteriak, siapa pun boleh mendengar

Notifikasi (WhatsApp/email/sosmed) **tidak boleh dipanggil dari dalam dapur**.
Dapur memancarkan kejadian ("pesanan selesai"), dan pendengar bereaksi. Menambah
layanan baru berarti menambah satu pendengar — dapur tidak berubah.

## Aturan emas saat menyentuh dapur

| Jenis perubahan | Aman? | Cara |
|---|---|---|
| **Menambah** hal baru | Aman | tambahkan sebagai pilihan **opsional**, jangan ubah yang lama |
| **Mengubah** hal lama | **Bahaya** | sediakan jalan baru **berdampingan**, jangan buang yang lama |
| **Menghapus** | Bahaya | baru setelah **tidak ada** situs yang memakainya |

Jangan mengganti kunci pintu — **tambahkan pintu baru di sebelahnya**. Situs versi
lama tetap bisa masuk sampai semua siap pindah.

## Stempel versi

Setiap deploy diberi nomor rilis. Halaman `GET /v1/version` mengembalikan:

```json
{
  "version": "v1.4.0",
  "commit": "abcdef1",
  "upstream": "v1.3.2",
  "hub_contract": "v1",
  "environment": "production"
}
```

- `version` / `commit` diisi deploy dari tag dan commit (`APP_VERSION`, `APP_COMMIT`).
  Kosong berarti deploy tidak diberi stempel — itu sinyal, bukan nilai default.
- `upstream` mencatat rilis cetakan asal situs ini (`APP_UPSTREAM`), supaya
  keterlambatan dari cetakan terlihat tanpa membandingkan dua repo.
- Rute ini **sengaja terbuka** walau situs sedang dinonaktifkan, supaya versi situs
  yang gelap pun bisa dibaca saat mengambil keputusan.

Sisi UI menampilkan stempel yang sama di sidebar admin (`VITE_APP_VERSION`).

## Checklist situs baru

```
[ ] Ambil kode dari cetakan (web-topup-monorepo), bukan dari situs klien lain
[ ] Isi colokan: provider top-up & payment gateway (lewat bentuk standar)
[ ] Isi hiasan: brand, domain, UI, alur
[ ] Isi pendengar: WA/email/sosmed yang dipakai
[ ] Isi .env (HUB_BASE_URL, kunci, dsb) — staging dulu, bukan produksi
[ ] Daftarkan di Hub (staging) dan pastikan hub:ping lulus
[ ] Deploy ke staging, uji, baru produksi (beri tag)
[ ] Catat APP_UPSTREAM = versi cetakan yang dipakai
```

## Alur rilis

- **Perubahan dapur** → dikerjakan di cetakan → beri versi → tiap situs menariknya →
  staging masing-masing → produksi.
- **Perubahan isian** → dikerjakan di situs itu saja → staging situs itu → produksi.

Kunci kalimatnya: **dapur jangan pernah mengetahui merek. Update jadi murah bukan
karena disiplin saat update, tapi karena cetakan punya titik sambungan yang tepat.**
