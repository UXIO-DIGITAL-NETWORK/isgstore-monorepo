/**
 * Public surface of the content feature. Routes and any cross-feature caller
 * import from here only — never reaching into the folders directly.
 */
export { ContentTabsLayout } from "./layouts/ContentTabsLayout";

export { default as ArticlesTabPage } from "./pages/ArticlesTabPage";
export { default as ArticlesFormTabPage } from "./pages/ArticlesFormTabPage";
export { default as NewsListPage } from "./pages/NewsListPage";
export { default as NewsFormPage } from "./pages/NewsFormPage";
export { default as ArticleCategoryListPage } from "./pages/ArticleCategoryListPage";
export { default as ArticleCategoryFormPage } from "./pages/ArticleCategoryFormPage";
export { default as FaqListPage } from "./pages/FaqListPage";
export { default as FaqFormPage } from "./pages/FaqFormPage";
export { default as PageListPage } from "./pages/PageListPage";
export { default as PageFormPage } from "./pages/PageFormPage";
export { default as BannerListPage } from "./pages/BannerListPage";
export { default as BannerFormPage } from "./pages/BannerFormPage";
export { default as AnnouncementListPage } from "./pages/AnnouncementListPage";
export { default as AnnouncementFormPage } from "./pages/AnnouncementFormPage";
export { default as TestimonialListPage } from "./pages/TestimonialListPage";
export { default as TestimonialFormPage } from "./pages/TestimonialFormPage";

export type {
  Announcement,
  Article,
  ArticleCategory,
  Banner,
  ContentPage,
  ContentSection,
  Faq,
  Testimonial,
} from "./types/content.type";
