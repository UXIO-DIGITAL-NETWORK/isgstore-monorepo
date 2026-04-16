# UDN Multi-Game Top-Up Platform

Sebuah platform web moden untuk pembelian mata wang dalam permainan (_top-up_) yang pantas, selamat, dan _type-safe_. Dibina dengan fokus utama pada pengalaman pengguna (_UX_) yang lancar melalui alur _Guest Checkout_ dan reka bentuk _E-sports Modern_ (Zelpoint-inspired) yang premium.

## 🛠 Tech Stack

### Frontend

- **Framework:** React 19 + TypeScript
- **Routing:** [TanStack Router](https://tanstack.com/router) (File-based, Type-safe with `beforeLoad` Guards)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query) (Server State Management)
- **State Management:** - **Server State:** TanStack Query
  - **Client State:** [Zustand](https://docs.pmnd.rs/zustand)
- **Form Handling:** React-Hook-Form + Zod (Schema Validation)
- **UI & Styling:** - [Hero UI](https://heroui.com/) & [Shadcn UI](https://ui.shadcn.com/)
  - Tailwind CSS v4 + [CVA](https://cva.style/) (Class Variance Authority)
- **Utilities:** `tailwind-merge` & `clsx` (via `cn()` helper)

## 📌 Ciri-Ciri Utama

- **Guest Checkout:** Pengguna boleh membeli terus tanpa perlu mendaftar/login.
- **Real-time Nickname Validation:** Pengesahan ID pemain secara langsung melalui API menggunakan TanStack Query.
- **Single Page Checkout:** Alur transaksi interaktif dalam satu halaman tanpa _reload_.
- **Member Dashboard:** Sejarah transaksi dan simpanan profil ID permainan untuk pengguna berdaftar.
- **Live Invoice Tracking:** Pemantauan status pembayaran secara masa nyata menggunakan _polling_ TanStack Query.

## 📂 Struktur Projek (Architecture)

Projek ini mengikuti seni bina **Feature-Based** dengan isolasi ketat:

```text
src/
├── components/               # 🧩 GLOBAL UI
│   ├── common/               # Komponen polimorfik (Box, Heading, Text) via CVA
│   ├── layouts/              # Wrapper layout global (RootLayout)
│   └── ui/                   # Base components (Hero UI / Shadcn)
├── features/                 # 📦 DOMAIN BISNIS (Isolated)
│   ├── auth/                 # Login/Register logic, Auth Hooks, local types
│   ├── checkout/             # Checkout logic, Game ID validation
│   └── home/                 # Landing components & banners
├── middlewares/              # 🛡️ ROUTE GUARDS (requireAuth, requireGuest)
├── store/                    # 📦 GLOBAL CLIENT STATE (useAuthStore, dsb)
├── types/                    # 🌐 GLOBAL TYPES
│   └── models/               # Entitas Database (User, Game, Transaction)
├── routes/                   # 📍 ROUTING (TanStack Router Tree)
└── lib/                      # 🛠️ UTILS (cn, axios, dsb)
```

## 📜 Peraturan Pembangunan (For AI Agents & Developers)

1. **The Golden Rule:** Fitur di dalam `src/features/` **DILARANG** mengimpor kode secara langsung dari fitur lain. Gunakan `src/types/models` untuk entitas yang bersifat global.
2. **Auth Guards:** Logika proteksi rute wajib ditempatkan di `src/middlewares/` dan dipanggil secara eksklusif pada properti `beforeLoad` di file rute. Jangan menggunakan komponen _wrapper_ manual.
3. **Polymorphic UI:** Komponen dasar seperti `<Box>`, `<Heading>`, dan `<Text>` wajib menggunakan utilitas `cn()` (`tailwind-merge`) untuk mencegah bentrokan _class_ Tailwind.
4. **Server State:** Gunakan `useQuery` untuk mengambil data dan `useMutation` untuk penghantaran data. Jangan gunakan `useEffect` untuk fetching data.
5. **Styling:** Patuhi palet warna _Dark Mode_ Zelpoint (Background: `#0a0a0a`, Accent: `#0ea5e9`).

## 🎨 Design System (Zelpoint Inspired)

- **Primary (Accent):** `#0ea5e9` (Sky Blue / Cyan)
- **Background:** `#0a0a0a` (True Black)
- **Surface:** `#171717` (Dark Charcoal)
- **Cards:** Menggunakan _gradient overlay_ bawah (`from-black/80`) untuk memastikan keterbacaan teks di atas gambar banner.

## 🚀 Bermula (Getting Started)

### Prasyarat

- Node.js (Versi 18 ke atas)
- NPM atau PNPM

### Pemasangan

1. Klon repositori ini:
   ```bash
   git clone https://github.com/muhammadsufyan/udn-topup-platform-fe.git
   ```
2. Masuk ke direktori projek:
   ```bash
   cd udn-topup-platform-fe
   ```
3. Pasang dependensi:
   ```bash
   npm install
   ```
4. Jalankan _development server_:
   ```bash
   npm run dev
   ```
