import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Главная",
    posts: "Записи",
    tags: "Теги",
    about: "Обо мне",
    archives: "Архив",
    search: "Поиск",
  },
  post: {
    publishedAt: "Опубликовано",
    updatedAt: "Обновлено",
    sharePostIntro: "Поделиться записью:",
    sharePostOn: "Поделиться записью в {{platform}}",
    sharePostViaEmail: "Отправить запись по почте",
    tagLabel: "Теги",
    backToTop: "Наверх",
    goBack: "Назад",
    editPage: "Редактировать",
    previousPost: "Предыдущая запись",
    nextPost: "Следующая запись",
  },
  pagination: {
    prev: "Назад",
    next: "Вперёд",
    page: "Страница",
  },
  home: {
    socialLinks: "Ссылки",
    featured: "Избранное",
    recentPosts: "Последние записи",
    allPosts: "Все записи",
  },
  footer: {
    copyright: "Копирайт",
    allRightsReserved: "Все права защищены.",
  },
  pages: {
    tagTitle: "Тег",
    tagDesc: "Все записи с тегом",

    tagsTitle: "Теги",
    tagsDesc: "Все теги, использованные в записях.",

    postsTitle: "Записи",
    postsDesc: "Все опубликованные записи.",

    archivesTitle: "Архив",
    archivesDesc: "Все записи по годам и месяцам.",

    searchTitle: "Поиск",
    searchDesc: "Найти запись ...",
  },
  a11y: {
    skipToContent: "Перейти к содержимому",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    toggleTheme: "Переключить тему",
    searchPlaceholder: "Искать по записям...",
    noResults: "Ничего не найдено",
    goToPreviousPage: "Предыдущая страница",
    goToNextPage: "Следующая страница",
  },
  notFound: {
    title: "404 Страница не найдена",
    message: "Такой страницы нет",
    goHome: "Вернуться на главную",
  },
} satisfies UIStrings;
