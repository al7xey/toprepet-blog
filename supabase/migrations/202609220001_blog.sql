create extension if not exists pgcrypto;

create table public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.is_blog_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      and (select auth.uid()) is not null
  );
$$;
revoke all on function public.is_blog_admin() from public;
grant execute on function public.is_blog_admin() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_id uuid references public.categories(id) on delete restrict,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create unique index categories_root_slug_idx on public.categories(slug) where parent_id is null;
create unique index categories_child_slug_idx on public.categories(parent_id, slug) where parent_id is not null;
create index categories_parent_order_idx on public.categories(parent_id, sort_order);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '',
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_html text not null default '',
  cover_image_url text,
  cover_image_alt text,
  status text not null default 'draft' check (status in ('draft','published')),
  category_id uuid not null references public.categories(id) on delete restrict,
  author_name text not null default 'Редакция TopRepet',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  modified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  view_count bigint not null default 0 check (view_count >= 0),
  is_featured boolean not null default false
);
create index articles_public_date_idx on public.articles(status, published_at desc);
create index articles_category_status_idx on public.articles(category_id, status);
create index articles_popular_idx on public.articles(status, view_count desc);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete set null,
  storage_path text not null unique,
  public_url text not null,
  alt text not null check (length(trim(alt)) > 0),
  caption text,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  file_size integer not null check (file_size > 0),
  mime_type text not null check (mime_type = 'image/webp'),
  created_at timestamptz not null default now()
);
create index media_article_idx on public.media(article_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger articles_updated_at before update on public.articles for each row execute function public.set_updated_at();

create or replace function public.set_article_dates() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' then new.published_at := now(); else new.published_at := null; end if;
    new.modified_at := null;
  elsif (to_jsonb(new) - 'view_count' - 'updated_at') = (to_jsonb(old) - 'view_count' - 'updated_at') then
    new.published_at := old.published_at; new.modified_at := old.modified_at;
  elsif old.status = 'draft' and new.status = 'published' then
    new.published_at := now(); new.modified_at := null;
  elsif old.status = 'published' and new.status = 'published' then
    new.published_at := old.published_at; new.modified_at := now();
  elsif new.status = 'draft' then
    new.published_at := null; new.modified_at := null;
  end if;
  return new;
end; $$;
create trigger articles_dates before insert or update on public.articles for each row execute function public.set_article_dates();

create or replace function public.increment_article_views(target_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.articles set view_count = view_count + 1
  where id = target_id and status = 'published';
end; $$;
revoke all on function public.increment_article_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_article_views(uuid) to service_role;

alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.media enable row level security;
create policy categories_read on public.categories for select to anon, authenticated using (true);
create policy categories_admin_insert on public.categories for insert to authenticated with check (public.is_blog_admin());
create policy categories_admin_update on public.categories for update to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy categories_admin_delete on public.categories for delete to authenticated using (public.is_blog_admin());
create policy articles_public_read on public.articles for select to anon, authenticated using (status = 'published');
create policy articles_admin_read on public.articles for select to authenticated using (public.is_blog_admin());
create policy articles_admin_insert on public.articles for insert to authenticated with check (public.is_blog_admin());
create policy articles_admin_update on public.articles for update to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy articles_admin_delete on public.articles for delete to authenticated using (public.is_blog_admin());
create policy media_read on public.media for select to anon, authenticated using (true);
create policy media_admin_insert on public.media for insert to authenticated with check (public.is_blog_admin());
create policy media_admin_update on public.media for update to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy media_admin_delete on public.media for delete to authenticated using (public.is_blog_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-images', 'article-images', true, 524288, array['image/webp'])
on conflict (id) do nothing;
create policy article_images_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'article-images');
create policy article_images_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'article-images' and public.is_blog_admin());
create policy article_images_admin_update on storage.objects for update to authenticated
using (bucket_id = 'article-images' and public.is_blog_admin()) with check (bucket_id = 'article-images' and public.is_blog_admin());
create policy article_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'article-images' and public.is_blog_admin());
