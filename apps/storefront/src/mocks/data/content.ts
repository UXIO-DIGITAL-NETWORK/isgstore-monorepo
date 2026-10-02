import type {
  ArticleCategoryModel,
  ArticleDetailResponse,
  ArticleModel,
  FaqModel,
  PageModel,
} from "@/types/models/article.model";

import { ARTICLE_IMAGES } from "./assets";

interface ArticleSeed {
  id: number;
  slug: string;
  title: string;
  categoryKey: string;
  /** The badge shown on the card — matches the Figma. */
  categoryName: string;
  publishedAt: string;
  excerpt: string;
  image: string;
}

/** The first three mirror the "Artikel Terbaru" section in the Figma. */
const ARTICLE_SEEDS: ArticleSeed[] = [
  {
    id: 1,
    slug: "cara-top-up-diamond-lebih-hemat",
    title: "Cara Top Up Diamond Lebih Hemat + Tips Dapat Bonus..",
    categoryKey: "mobile-legends",
    categoryName: "MOBILE LEGEND",
    publishedAt: "2026-05-01T08:00:00Z",
    excerpt: "Simak cara top up diamond Mobile Legends dengan harga paling hemat plus tips dapat bonus.",
    image: ARTICLE_IMAGES[0],
  },
  {
    id: 2,
    slug: "top-up-murah-cepat-harga-terbaik",
    title: "Top Up Murah & Cepat, Ini Cara Dapat Harga Terbaik.",
    categoryKey: "pubg",
    categoryName: "PUBG MOBILE",
    publishedAt: "2026-04-28T08:00:00Z",
    excerpt: "Panduan mendapatkan harga terbaik untuk top up UC PUBG Mobile, cepat dan aman.",
    image: ARTICLE_IMAGES[1],
  },
  {
    id: 3,
    slug: "panduan-top-up-uc-aman-instan",
    title: "Panduan Top Up UC Aman dan Instan untuk Pemain Baru & Pro",
    categoryKey: "free-fire",
    categoryName: "FREE FIRE",
    publishedAt: "2026-04-12T08:00:00Z",
    excerpt: "Langkah demi langkah top up UC dengan aman dan instan untuk pemain baru maupun pro.",
    image: ARTICLE_IMAGES[2],
  },
  {
    id: 4,
    slug: "tips-menang-mobile-legends",
    title: "5 Tips Menang Ranked Mobile Legends di Season Ini",
    categoryKey: "mobile-legends",
    categoryName: "MOBILE LEGEND",
    publishedAt: "2026-04-05T08:00:00Z",
    excerpt: "Tingkatkan win rate kamu dengan menerapkan lima tips sederhana berikut.",
    image: ARTICLE_IMAGES[3],
  },
  {
    id: 5,
    slug: "game-mobile-terpopuler-2026",
    title: "Daftar Game Mobile Terpopuler Sepanjang 2026",
    categoryKey: "berita",
    categoryName: "BERITA",
    publishedAt: "2026-03-22T08:00:00Z",
    excerpt: "Deretan game mobile yang paling banyak dimainkan sepanjang tahun ini.",
    image: ARTICLE_IMAGES[4],
  },
  {
    id: 6,
    slug: "cara-klaim-refund-top-up",
    title: "Cara Klaim Refund Jika Top Up Gagal Terkirim",
    categoryKey: "tips",
    categoryName: "TIPS",
    publishedAt: "2026-03-10T08:00:00Z",
    excerpt: "Langkah mudah mengajukan refund ketika pesanan top up tidak kunjung masuk.",
    image: ARTICLE_IMAGES[5],
  },
];

export const MOCK_ARTICLES: ArticleModel[] = ARTICLE_SEEDS.map((seed) => ({
  id: seed.id,
  slug: seed.slug,
  type: "article",
  title: seed.title,
  excerpt: seed.excerpt,
  author: "Tim Topup Game",
  image_url: seed.image,
  published_at: seed.publishedAt,
  is_featured: seed.id <= 3,
  category: { key: seed.categoryKey, name: seed.categoryName },
}));

function bodyFor(seed: ArticleSeed): { heading?: string; paragraphs: string[] }[] {
  return [
    { paragraphs: [seed.excerpt, "Topup Game memproses setiap pesanan secara otomatis sehingga saldo game kamu masuk hanya dalam hitungan detik."] },
    { heading: "Kenapa Top Up di Topup Game?", paragraphs: ["Harga bersaing, metode pembayaran lengkap, dan dukungan pelanggan 24 jam."] },
    { heading: "Langkah-langkah", paragraphs: ["Pilih game, masukkan User ID, tentukan nominal, lalu selesaikan pembayaran lewat metode favoritmu."] },
  ];
}

export const MOCK_ARTICLE_DETAILS: Record<string, ArticleDetailResponse> = Object.fromEntries(
  ARTICLE_SEEDS.map((seed) => {
    const model = MOCK_ARTICLES.find((article) => article.slug === seed.slug) as ArticleModel;
    const related = MOCK_ARTICLES.filter((article) => article.slug !== seed.slug).slice(0, 3);

    return [
      seed.slug,
      {
        article: {
          ...model,
          body_sections: bodyFor(seed),
          meta: {
            title: model.title,
            description: model.excerpt,
            keywords: [seed.categoryName, "top up game"],
            robots: null,
          },
        },
        related,
      },
    ];
  }),
);

export const MOCK_ARTICLE_CATEGORIES: ArticleCategoryModel[] = [
  { id: 1, name: "Mobile Legends", key: "mobile-legends", sort_order: 1, status: true },
  { id: 2, name: "PUBG Mobile", key: "pubg", sort_order: 2, status: true },
  { id: 3, name: "Free Fire", key: "free-fire", sort_order: 3, status: true },
  { id: 4, name: "Tips", key: "tips", sort_order: 4, status: true },
  { id: 5, name: "Berita", key: "berita", sort_order: 5, status: true },
  { id: 6, name: "Lainnya", key: "lainnya", sort_order: 6, status: true },
];

export const MOCK_FAQS: FaqModel[] = [
  {
    id: 1,
    question: "Berapa lama proses top up?",
    answer: "Proses berjalan otomatis dan biasanya selesai dalam hitungan detik setelah pembayaran dikonfirmasi.",
    group: "Umum",
  },
  {
    id: 2,
    question: "Metode pembayaran apa saja yang tersedia?",
    answer: "Kami mendukung QRIS, virtual account bank, dan berbagai e-wallet seperti GoPay, OVO, dan DANA.",
    group: "Pembayaran",
  },
  {
    id: 3,
    question: "Bagaimana jika saldo tidak masuk?",
    answer: "Hubungi admin melalui WhatsApp dengan menyertakan nomor invoice, dan tim kami akan segera membantu.",
    group: "Umum",
  },
  {
    id: 4,
    question: "Apakah saya perlu membuat akun?",
    answer: "Tidak wajib. Kamu bisa top up sebagai tamu, atau membuat akun untuk menyimpan riwayat transaksi.",
    group: "Akun",
  },
];

const PAGE_SEEDS: Record<string, { title: string; intro: string[]; section: { heading: string; paragraphs: string[] } }> = {
  "kebijakan-privasi": {
    title: "Kebijakan Privasi",
    intro: ["Kami menghargai privasi kamu dan berkomitmen melindungi data pribadi yang kamu berikan."],
    section: { heading: "Data yang Kami Kumpulkan", paragraphs: ["Kami hanya mengumpulkan data yang diperlukan untuk memproses pesanan, seperti User ID game dan kontak."] },
  },
  "syarat-ketentuan": {
    title: "Syarat & Ketentuan",
    intro: ["Dengan menggunakan layanan Topup Game, kamu menyetujui syarat dan ketentuan berikut."],
    section: { heading: "Penggunaan Layanan", paragraphs: ["Layanan hanya boleh digunakan untuk tujuan yang sah dan tidak melanggar hukum."] },
  },
  "kebijakan-pengembalian": {
    title: "Kebijakan Pengembalian",
    intro: ["Kami menyediakan kebijakan pengembalian dana untuk pesanan yang gagal diproses."],
    section: { heading: "Ketentuan Refund", paragraphs: ["Refund diajukan maksimal 2x24 jam setelah pesanan dinyatakan gagal."] },
  },
};

export const MOCK_PAGES: Record<string, PageModel> = Object.fromEntries(
  Object.entries(PAGE_SEEDS).map(([slug, seed]) => [
    slug,
    {
      slug,
      title: seed.title,
      intro: seed.intro,
      sections: [seed.section],
      meta: { title: seed.title, description: seed.intro[0] ?? null, robots: null },
      updated_at: "2026-04-01T00:00:00Z",
    },
  ]),
);
