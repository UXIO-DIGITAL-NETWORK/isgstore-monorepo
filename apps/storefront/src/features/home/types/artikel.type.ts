export interface Article {
  id: string;
  /** Matches the slug in berita's article data — used to link to /berita/$slug */
  slug: string;
  category: string;
  title: string;
  date: string;
  image: string;
}
