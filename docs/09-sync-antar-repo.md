# Sinkronisasi Antar-Repo (`isgstore-monorepo` ↔ cetakan `web-topup-monorepo`)

Dokumen ini aturan pembagian kerja antara **repo ini** (situs klien, merek sendiri)
dan **cetakan**. Cetakan adalah sumber perbaikan **dapur** (engine transaksi +
integrasi Hub); repo ini menambahkan identitas dan hal-hal khas klien.

Alat: `git merge` 3-arah dari ref cetakan. **Jangan** `git checkout <ref-cetakan> --`
untuk seluruh pohon — itu membuang pekerjaan engine repo ini.

```bash
git fetch template --tags --prune          # remote cetakan = web-topup-monorepo
git merge --no-commit --no-ff <tag-cetakan> # mis. v1.0.0
# selesaikan konflik menurut tabel di bawah, lalu commit
```

## Peta zona

| Zona | Path (repo ini) | Sumber saat merge |
|---|---|---|
| **Dapur** | `apps/api/app/Contracts/**`, `app/Notifications/Channels/**`, `app/Support/Integration/**`, `app/Http/Controllers/Api/VersionController.php`, `app/Console/Commands/HubPingCommand.php`, `config/{notifications,version}.php`, `app/Providers/AppServiceProvider.php`, `app/Services/{Payment/MonetapayService,UxiolabsService}.php`, `bootstrap/app.php`, `routes/**`, `phpunit.xml`, `tests/**` | **cetakan** |
| **Ops/rilis** | `.github/workflows/**`, `docs/**`, `README.md`, `.gitignore` | **cetakan** |
| **Hiasan/brand** | `apps/*/index.html`, `apps/*/src/**` (teks merek, locales, `useBranding.ts`), `apps/*/CLAUDE.md`, `RENCANA-LANJUTAN.md` | **repo ini** |
| **Kredensial** | `apps/api/.env`, `apps/*/.env`, `.env.example` | **repo ini** (key baru cetakan ditambah tanpa mengubah nilai) |
| **Seed/data klien** | `apps/api/database/seeders/**` | **repo ini** |

## Aturan resolusi konflik

- **Berkas dapur yang kedua sisi ubah → HAND-MERGE, jangan `--theirs`.** Panggilan
  langsung (`MonetapayService::…`, `UxiolabsService::…`) diganti panggilan lewat
  colokan (`app(PaymentGateway::class)…`, `app(SupplierGateway::class)…`) — itu
  perubahan cetakan yang harus diadopsi **tanpa** membuang logika engine repo ini.
- **Brand/kredensial/seed → ambil repo ini.** Cetakan menetralkan merek; itu tidak
  boleh masuk.
- **Ops/docs → ambil cetakan**, kecuali perilaku deploy yang menyangkut server.
- Aturan emas cetakan: **hanya menambah; jangan membuang yang lama.** Driver yang
  tidak sesuai kontrak harus gagal keras (`AdapterRegistry`).

## Setelah merge

1. `.upstream-version` = tag cetakan yang disinkronkan (dibaca `GET /v1/version`).
2. Jalankan: `apps/api` → `php artisan test` + `./vendor/bin/pint --test`;
   tiap frontend → typecheck + lint + test.
3. Audit kebocoran merek: `grep -rinE "topupgame|uxiotopup\.id" apps/*/src` —
   yang muncul hanya boleh domain supplier asli, bukan merek cetakan.
