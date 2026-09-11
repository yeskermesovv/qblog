import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://yeskermesovv.github.io/qblog/",
    title: "qblog",
    description: "Личный блог: заметки о разработке и всём, что рядом.",
    author: "yeskermesovv",
    profile: "https://github.com/yeskermesovv",
    ogImage: "default-og.jpg",
    lang: "ru",
    timezone: "Asia/Almaty",
    dir: "ltr",
  },
  posts: {
    perPage: 6,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/yeskermesovv/qblog/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/yeskermesovv" },
  ],
  shareLinks: [
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "mail", url: "mailto:?subject=Интересная%20запись&body=" },
  ],
});
