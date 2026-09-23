# Блог TopRepet

Редакционный блог для `blog.toprepet.ru`: статьи о школьных предметах и экзаменах, вложенные рубрики и собственная мини-CMS. Публичные страницы формируются на сервере Next.js, поэтому текст статьи, заголовки, ссылки и метаданные находятся в HTML-ответе и читаются без клиентского JavaScript.

## Что внутри

- Главная с направлениями, свежими и популярными статьями.
- Вложенные рубрики `/rubrics/ветка/подветка/тема` и статьи `/articles/slug`.
- Защищённая админка: обзор, CRUD рубрик, список и редактор статей, публикация, предпросмотр, медиа.
- Tiptap хранит документ в `content_json`. На сервере из разрешённых узлов формируется и дополнительно очищается `content_html`. В статье используется очищенный HTML, а не клиентский редактор.
- Supabase Postgres, Auth, Storage, RLS; Next.js App Router, TypeScript, Tailwind CSS, Lucide React.
- Canonical, Open Graph, Twitter, sitemap, robots, BlogPosting и BreadcrumbList JSON-LD.

## 1. Создайте Supabase project

Создайте проект в [Supabase](https://supabase.com/dashboard) и откройте **Project Settings → API**. Сохраните URL проекта и publishable/anon key. Service role key храните только в серверной среде. Для тестирования полезно завести отдельный проект, чтобы не затронуть другие таблицы.

## 2. Выполните migration

Откройте **SQL Editor** и по порядку выполните все файлы из `supabase/migrations`: сначала [202609220001_blog.sql](supabase/migrations/202609220001_blog.sql), затем [202609230002_hardening.sql](supabase/migrations/202609230002_hardening.sql). Миграции создают таблицы, индексы, триггеры дат, защиту иерархии от циклов, RLS, политики Storage и атомарную функцию просмотров. Проверьте, что появились `categories`, `articles`, `media` и bucket `article-images`.

Bucket создаётся самой миграцией. Если его нет, вручную создайте **public bucket** с именем `article-images`, лимитом 512 KB и MIME `image/webp`; затем повторно проверьте политики Storage. Публичный bucket нужен только для оптимизированных изображений — доступ к upload и delete имеют администраторы.

Для демонстрации структуры можно отдельно выполнить [supabase/seed.sql](supabase/seed.sql). Он добавляет ЕГЭ → Информатика → Задание 12 и **одну статью со статусом draft**. Текст не публикуется автоматически. На публичных страницах этот черновик не появится.

## 3. Настройте Auth и администратора

В Supabase Auth включите **Email + Password**. Создайте пользователя с вашим email и паролем через **Authentication → Users**. Затем добавьте этот же email в разрешённый список БД:

```sql
insert into public.admin_users (email) values ('your-email@example.com');
```

В `ADMIN_EMAIL` укажите тот же адрес. Несколько администраторов можно перечислить через запятую и добавить каждый адрес в `admin_users`. Сервер проверяет email через Supabase Auth и `ADMIN_EMAIL`, а RLS независимо проверяет `admin_users`. Обычная регистрация и публичная запись материалов отсутствуют.

После создания администратора отключите публичную регистрацию в **Authentication → Sign In / Providers → Email → Allow new users to sign up**. В **URL Configuration** задайте `https://blog.toprepet.ru` как Site URL и добавьте production и локальные redirect URL.

## 4. Запустите локально

```bash
npm install
cp .env.example .env.local
npm run dev
```

В PowerShell вместо `cp` можно выполнить `Copy-Item .env.example .env.local`. Заполните `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_EMAIL=your-email@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_YANDEX_METRIKA_ID=
```

`SUPABASE_SERVICE_ROLE_KEY` используется **только серверным endpoint просмотра**, чтобы вызвать закрытый RPC. Не добавляйте к нему префикс `NEXT_PUBLIC_` и не коммитьте `.env.local`. Если переменные Supabase отсутствуют, публичная оболочка работает с пустым состоянием, вход в админку недоступен.

Откройте `http://localhost:3000/admin/login`, войдите и проверьте `http://localhost:3000/admin`. Создайте рубрику в `/admin/categories`, затем статью в `/admin/articles/new`. Сохраните черновик, откройте предпросмотр, опубликуйте и проверьте публичный URL `/articles/ваш-slug`.

## 5. Как работать со статьями

Заголовок H1 задаётся вне редактора. Slug предлагается из русского названия транслитерацией и редактируется вручную. В Tiptap доступны абзацы, H2/H3, выделение, списки, цитаты, ссылки, разделитель, история и изображения. Произвольные шрифты, размеры, цвета и HTML редактор не принимает.

У каждого изображения обязателен alt, подпись необязательна. Сначала сохраните черновик, затем добавляйте изображения. Перед upload браузер преобразует JPG/PNG/WebP в WebP, ограничивает размер и не сохраняет исходный файл. Оптимизированный файл отправляется в `article-images`; сервер снова проверяет MIME, реальные размеры и вес. После удаления изображения из редактора сохраните статью: только после успешного сохранения удаляются запись `media` и объект Storage.

Предпросмотр показывает текущие несохранённые изменения в отдельной вкладке и не меняет опубликованную статью. Статья становится видимой только после публикации. При первой публикации БД ставит `published_at`, а `modified_at` остаётся пустым. При редактировании уже опубликованной статьи `published_at` сохраняется и устанавливается `modified_at`. Снятие с публикации сбрасывает обе публичные даты.

## 6. Vercel и домен

Импортируйте репозиторий в Vercel как Next.js проект. Добавьте переменные из `.env.example` в **Project Settings → Environment Variables**. Для production установите `NEXT_PUBLIC_SITE_URL=https://blog.toprepet.ru`. Не помещайте service role key в публичные переменные. Подключите `blog.toprepet.ru` в настройках Domains проекта Vercel и внесите DNS-запись, которую покажет Vercel, у вашего DNS-провайдера. Это нужно сделать вручную — репозиторий сам DNS не меняет и ничего не публикует.

Серверный secret/service key добавляйте только в доверенные Vercel environments. Для Preview лучше использовать отдельный Supabase project; если preview работает с production-базой, включите Vercel Deployment Protection и не выдавайте доступ посторонним веткам.

Опционально задайте `NEXT_PUBLIC_YANDEX_METRIKA_ID`. Без него аналитика не подключается. Административные пути не считаются публичными страницами.

## Расширение после MVP

Комментарии и лайки намеренно не реализованы. Существующие UUID статей и изолированные RLS-политики позволяют добавить их без изменения `articles`: отдельную `comments` с `article_id`, автором, статусом модерации и датами; отдельную `article_likes` с уникальной парой `article_id + user_id`. Счётчики следует менять закрытыми атомарными RPC, а публичное чтение и пользовательскую запись — отдельными RLS-политиками.

## Проверка

```bash
npm run lint
npm run build
```

Проверьте вручную в браузере: главную, вложенную рубрику, опубликованную статью, login, сохранение черновика, предпросмотр, публикацию и последующее обновление, загрузку/удаление изображения, `/sitemap.xml`, `/robots.txt`. Убедитесь, что в **View Source** статьи есть H1, анонс, основной текст, H2/H3, canonical и JSON-LD. На мобильном проверьте ширины 360 и 390 px, на планшете 768 px и на десктопе 1440 px.
