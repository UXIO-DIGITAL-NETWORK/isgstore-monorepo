# Arsitektur Kode dan Berkas

```
uxiotopup-monorepo/
├── apps/
│   ├── api/          Laravel 13 · PHP 8.4 · pemilik seluruh migrasi
│   ├── admin/        React 19 · panel admin
│   ├── storefront/   React 19 · etalase pelanggan
│   └── payment/      React 19 · Uxiolabs Pay
├── docs/             dokumen ini
├── .github/workflows/ satu CI + satu deploy, dengan path filter
└── package.json      skrip lintas-app
```

Tiap app tetap membawa `CLAUDE.md`-nya sendiri. **Jangan dipindah ke akar** — Claude Code membaca berkas terdekat dengan yang sedang dikerjakan, jadi menyatukannya justru menghilangkan konteks.

---

## API — pipeline yang wajib diikuti

```
Route → FormRequest (validasi) → Controller (bangun DTO) → Action (logika) → ApiResponse
```

- **Controller adalah router murni.** Memvalidasi, membangun DTO, memanggil satu Action, mengembalikan hasil. Tidak ada kueri, tidak ada percabangan, tidak ada logika bisnis.
- **Action memegang semua logika.** Satu Action = satu tugas. Menerima DTO, berjalan di dalam `DB::transaction()` bila mengubah keadaan.
- **DTO adalah `readonly` value object** — satu-satunya hal yang berpindah dari Controller ke Action.
- **Trait `ApiResponse`** menyeragamkan bentuk jawaban: `{status, code, message, data}`. Semua `index()` berpaginasi memakai `paginatedResponse()` sehingga seluruh endpoint daftar punya bentuk yang sama.

Satu penyimpangan yang disengaja: **`CheckoutController` memvalidasi inline**, bukan lewat FormRequest, karena aturan `guest_contact` bersifat dinamis — wajib untuk tamu, opsional untuk member.

### Peta `app/`

| Direktori | Isi | Ukuran |
|---|---|---|
| `Actions/` | Seluruh logika bisnis, dikelompokkan per domain | ~256 berkas, 43 domain |
| `DTOs/` | Masukan tiap Action | ~76 berkas |
| `Http/Requests/` | Validasi | ~110 berkas |
| `Http/Controllers/Api/` | Router murni | 14 + 18 subdirektori |
| `Http/Resources/` | Pembentuk keluaran | ~40 berkas |
| `Http/Middleware/` | 7 penjaga akses | 7 berkas |
| `Support/` | Helper domain murni, tanpa DB | ~45 berkas, 19 subdirektori |
| `Models/` | Eloquent | 58 berkas |
| `Enums/` | Kosakata status | 15 berkas |
| `Services/` | Klien sistem luar | 9 berkas |
| `Jobs/` | Pekerjaan antrean | 7 berkas |
| `Console/Commands/` | Perintah artisan | 19 berkas |

Domain terbesar di `Actions/`: **Product** (21), **Uxiolabs** (15), **Transaction** (13), **Refund** (12), **Storefront** (10).

### `Support/` — tempat aturan bisnis yang harus punya satu implementasi

Bagian ini paling layak dibaca lebih dulu, karena di sinilah aturan yang *tidak boleh* punya dua versi:

| Berkas | Menjaga |
|---|---|
| `Support/Money.php` | Satu-satunya format rupiah yang dilihat pelanggan |
| `Support/Phone.php` | Bentuk kanonik E.164, dan daftar ejaan lama untuk pencarian |
| `Support/Pricing/PlanPrice.php` | Harga yang dikutip = harga yang ditagih |
| `Support/Points/PointLedger.php` | Satu-satunya yang menggerakkan `users.point` |
| `Support/Points/PointRules.php` | Rumus poin, dipakai bersama oleh grant dan storefront |
| `Support/Wallet/WalletLedger.php` | Satu-satunya yang menggerakkan saldo |
| `Support/Refund/RefundSla.php` | Hitungan 2×24 jam kerja |
| `Support/Report/PeriodResolver.php` | Batas periode laporan, dihitung di zona dinding platform (WIB) |
| `Support/DateTime/Wib.php` | Satu-satunya zona dinding platform untuk tanggal yang dirender server (PDF, email, notifikasi) |
| `Support/Auth/{Base32,Totp}.php` | TOTP RFC 6238, ditulis sendiri, dikunci vektor uji RFC |
| `Support/Transaction/ProviderStatusPolicy.php` | Matriks `status` ↔ `provider_status` |

Aturannya sederhana: **kalau sebuah angka menyangkut uang, ia hanya boleh dihitung di satu tempat.** Buku besar poin dan saldo menolak menjadi negatif, mengunci baris selama baca-ubah-tulis, dan mencatat nilai sebelum/sesudah di tiap entri.

---

## Frontend — tiga aplikasi, satu pola

Ketiganya memakai stack yang sama, dengan **nol perbedaan versi** pada dependensi bersama: React 19, Vite 7, Tailwind v4, TanStack Router/Query/Table, zustand, React Hook Form + zod, axios, Vitest.

### Struktur per-fitur

```
src/
├── features/<nama>/     satu irisan fitur, terisolasi
│   ├── components/
│   ├── hooks/           useQuery / useMutation
│   ├── services/        pemanggilan API + pemetaan
│   ├── types/
│   └── pages/
├── components/{ui,common}/   shadcn + primitif sendiri
├── routes/              registri saja, komponen diimpor dari features
├── lib/                 axios, utils
└── store/               zustand
```

**Aturan isolasi:** satu `features/*` tidak boleh mengimpor dari `features/*` yang lain. Kode bersama diangkat ke `components/common`, `lib`, atau `utils`.

**Routing hanya registri.** Berkas di `src/routes/` cuma merangkai `createFileRoute` dengan komponen dari `features/`. Penjaga akses (`requireAuth`, `requireGuest`, `requirePermission`) dipanggil di `beforeLoad`, tidak pernah di dalam komponen. `routeTree.gen.ts` dihasilkan otomatis — jangan disunting tangan.

### Irisan fitur tiap app

**`apps/admin`** (16): `activity`, `administration`, `auth`, `categories`, `content`, `dashboard`, `feedback`, `financial`, `integration`, `marketing`, `membership`, `pricing`, `products`, `refunds`, `reports`, `transactions`.

**`apps/storefront`** (15): `auth`, `berita`, `checkout`, `faq`, `home`, `invoice`, `kalkulator`, `leaderboard`, `magic-wheel`, `member-dashboard`, `price-list`, `privacy-policy`, `refund`, `track-order`, `zodiac`.

**`apps/payment`** (4): `auth`, `dashboard`, `finance`, `merchant`.

### Perbedaan yang perlu diketahui

| | admin | storefront | payment |
|---|---|---|---|
| Test | jsdom + Testing Library | **`environment: "node"`**, hanya `.ts` | jsdom + Testing Library |
| i18n | i18next, **selesai** &mdash; pilihan di `users.locale` | i18next, URL berawalan locale | i18next, **selesai** &mdash; pilihan di `users.locale` |
| UI tambahan | — | HeroUI | — |
| Zona waktu test | — | — | **dipatok `Asia/Jakarta`** |

Dua di antaranya menyimpan jebakan nyata:

- **Vitest storefront memakai `include: ["src/**/*.test.ts"]`** — berkas `.tsx` **tidak pernah dijalankan**. Karena itu logika yang perlu diuji harus tinggal di `lib/*.ts`, bukan di komponen. Pola ini sudah dipakai `checkout/lib/points.ts` dan `invoice/lib/pointsRow.ts`.
- **`apps/payment/vitest.config.ts` menyetel `process.env.TZ` di ruang lingkup modul.** Kalau ketiga suite pernah digabung jadi satu proses, setelan itu bocor dan mengubah perenderan tanggal di dua app lainnya.

### Zona waktu: satu jam dinding untuk seluruh platform

**WIB (Asia/Jakarta, GMT+7), dan itu bukan preferensi pengguna.** Aturannya:

- **Penyimpanan tetap UTC.** `config('app.timezone')` di kedua API tidak diubah; kolom `timestamp` tetap UTC dan JSON tetap ISO-8601 UTC. Mengubah app tz akan menggeser cara tiap instant ditulis dan dibandingkan.
- **Konversi hanya di batas tampilan.** Frontend memformat di `Asia/Jakarta` lewat modul tanggal kanonik tiap app (`utils/date.ts`, `lib/format.ts`), dan tiap tampilan yang memuat jam menyematkan label `WIB (GMT+7)`. Tanggal-saja dihitung pada hari WIB, tanpa label.
- **`users.timezone` tidak lagi menentukan apa pun.** Nilainya dinormalkan ke `Asia/Jakarta` (login, register, Google, `sync-timezone`, dan migrasi satu kali), sehingga jam di layar dan batas hari laporan selalu sepakat.
- **Tes tidak boleh bergantung pada zona host.** Ekspektasi ditulis sebagai waktu literal, dan suite dijalankan juga dengan `TZ` non-WIB — kalau hasilnya berubah, masih ada formatter yang membaca zona browser.

---

## Kode yang masih terduplikasi

Belum disatukan, dan itu **disengaja** — monorepo ini adalah pemindahan, bukan refactor. Peta duplikasinya:

**Identik byte-per-byte** (aman diangkat kapan saja): 49 dari 52 primitif shadcn antara admin dan payment; 12 komponen `common/`; `lib/echo.ts` (tiga salinan); `cn` di `lib/utils.ts`; `types/api.type.ts` (admin ↔ payment); `utils/initials.ts`; `test/apiEnvelope.ts`; `lib/imageCompression.ts` (admin ↔ storefront).

**Mirip tapi berbeda — justru ini yang berbahaya:**

| Berkas | Masalahnya |
|---|---|
| `lib/apiMappers.ts` | Versi admin sudah dikeraskan untuk tiga bentuk paginator; versi payment masih naif dan **membawa bug yang admin sudah perbaiki** |
| `utils/date.ts` vs `lib/format.ts` | `formatDate`/`formatDateTime` bernama sama tapi implementasinya beda — menyatukan sembarangan akan **mengubah tampilan tanggal** di storefront |
| `store/useAuthStore.ts` | Storefront berbeda bentuk: tanda tangan aksinya posisional, tanpa `permissions`, dan tidak menyimpan user di cookie |
| `components/common/{Text,Heading,Container}.tsx` | Versi storefront membawa gaya etalase yang di-hardcode; API-nya bisa dibagi, gayanya tidak |

Urutan penyatuan yang disarankan bila nanti dikerjakan: `@uxio/ui` (paling murah, ~60 berkas) → `@uxio/api` → `@uxio/format` → `@uxio/auth` (paling sulit, harus menyeragamkan model peran lebih dulu).
