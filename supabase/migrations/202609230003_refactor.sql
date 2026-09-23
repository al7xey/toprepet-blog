-- Editorial data, media lifecycle, previews and permanent article redirects.
-- This migration is additive and safe to run after 202609230002_hardening.sql.

alter table public.articles
  add column if not exists reading_time_minutes integer not null default 1
    check (reading_time_minutes > 0),
  add column if not exists toc_json jsonb not null default '[]'::jsonb;

update public.articles
set reading_time_minutes = greatest(1, ceil(cardinality(regexp_split_to_array(trim(regexp_replace(content_html, '<[^>]+>', ' ', 'g')), '\s+')) / 180.0)::integer)
where length(trim(content_html)) > 0 and reading_time_minutes = 1;

alter table public.media
  add column if not exists status text not null default 'attached'
    check (status in ('temporary', 'attached'));
alter table public.media drop constraint if exists media_alt_length_check;
alter table public.media add constraint media_alt_length_check check (char_length(alt) between 1 and 300) not valid;
alter table public.media drop constraint if exists media_caption_length_check;
alter table public.media add constraint media_caption_length_check check (caption is null or char_length(caption) <= 400) not valid;

update public.media set status = 'attached' where status is null;
create index if not exists media_status_created_idx on public.media(status, created_at);
drop policy if exists media_read on public.media;
create policy media_read on public.media for select to anon, authenticated using (status = 'attached');
drop policy if exists media_admin_read on public.media;
create policy media_admin_read on public.media for select to authenticated using (public.is_blog_admin());

create table if not exists public.article_previews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  payload jsonb not null,
  created_by uuid not null default auth.uid(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  created_at timestamptz not null default now()
);
create index if not exists article_previews_expiry_idx on public.article_previews(expires_at);
alter table public.article_previews enable row level security;
drop policy if exists article_previews_admin_all on public.article_previews;
create policy article_previews_admin_all on public.article_previews
  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

create table if not exists public.article_slug_redirects (
  old_slug text primary key check (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists article_slug_redirects_article_idx on public.article_slug_redirects(article_id);
alter table public.article_slug_redirects enable row level security;
drop policy if exists article_slug_redirects_public_read on public.article_slug_redirects;
create policy article_slug_redirects_public_read on public.article_slug_redirects
  for select to anon, authenticated using (true);
drop policy if exists article_slug_redirects_admin_all on public.article_slug_redirects;
create policy article_slug_redirects_admin_all on public.article_slug_redirects
  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

alter table public.articles drop constraint if exists articles_title_length_check;
alter table public.articles add constraint articles_title_length_check check (char_length(title) between 1 and 200) not valid;
alter table public.articles drop constraint if exists articles_slug_length_check;
alter table public.articles add constraint articles_slug_length_check check (char_length(slug) between 1 and 180) not valid;
alter table public.articles drop constraint if exists articles_excerpt_length_check;
alter table public.articles add constraint articles_excerpt_length_check check (char_length(excerpt) <= 400) not valid;
alter table public.articles drop constraint if exists articles_seo_title_length_check;
alter table public.articles add constraint articles_seo_title_length_check check (seo_title is null or char_length(seo_title) <= 200) not valid;
alter table public.articles drop constraint if exists articles_seo_description_length_check;
alter table public.articles add constraint articles_seo_description_length_check check (seo_description is null or char_length(seo_description) <= 400) not valid;
alter table public.categories drop constraint if exists categories_name_length_check;
alter table public.categories add constraint categories_name_length_check check (char_length(name) between 1 and 120) not valid;
alter table public.categories drop constraint if exists categories_slug_length_check;
alter table public.categories add constraint categories_slug_length_check check (char_length(slug) between 1 and 120) not valid;
alter table public.categories drop constraint if exists categories_description_length_check;
alter table public.categories add constraint categories_description_length_check check (description is null or char_length(description) <= 600) not valid;

create or replace function public.set_article_dates() returns trigger
language plpgsql set search_path = '' as $$
declare
  editorial_changed boolean;
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
    end if;
    new.modified_at := null;
    return new;
  end if;

  editorial_changed :=
    (to_jsonb(new) - array['view_count','updated_at','published_at','modified_at'])
      is distinct from
    (to_jsonb(old) - array['view_count','updated_at','published_at','modified_at']);

  -- The first publication timestamp is immutable, including unpublish/republish.
  new.published_at := old.published_at;
  new.modified_at := old.modified_at;
  if new.status = 'published' and old.published_at is null then
    new.published_at := now();
    new.modified_at := null;
  elsif old.published_at is not null and editorial_changed then
    new.modified_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.remember_article_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.slug is distinct from new.slug then
    if exists (select 1 from public.articles where slug = new.slug and id <> new.id)
       or exists (select 1 from public.article_slug_redirects where old_slug = new.slug and article_id <> new.id) then
      raise exception 'Article slug is already reserved';
    end if;
    insert into public.article_slug_redirects(old_slug, article_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update set article_id = excluded.article_id;
  end if;
  return new;
end;
$$;
drop trigger if exists articles_remember_slug on public.articles;
create trigger articles_remember_slug before update of slug on public.articles
for each row execute function public.remember_article_slug();

create or replace function public.prevent_reserved_article_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.article_slug_redirects where old_slug = new.slug and article_id <> new.id) then
    raise exception 'Article slug is reserved by a redirect';
  end if;
  return new;
end;
$$;
drop trigger if exists articles_prevent_reserved_slug on public.articles;
create trigger articles_prevent_reserved_slug before insert or update of slug on public.articles
for each row execute function public.prevent_reserved_article_slug();

create or replace function public.prevent_published_category_path_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.slug is not distinct from new.slug and old.parent_id is not distinct from new.parent_id then
    return new;
  end if;
  if exists (
    with recursive branch(id) as (
      select old.id
      union all
      select c.id from public.categories c join branch b on c.parent_id = b.id
    )
    select 1 from public.articles a join branch b on a.category_id = b.id
    where a.status = 'published' limit 1
  ) then
    raise exception 'Published category paths are locked';
  end if;
  return new;
end;
$$;
drop trigger if exists categories_lock_published_path on public.categories;
create trigger categories_lock_published_path before update of slug, parent_id on public.categories
for each row execute function public.prevent_published_category_path_change();

create or replace function public.require_leaf_article_category() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.categories where parent_id = new.category_id) then
    raise exception 'Articles must belong to a leaf category';
  end if;
  return new;
end;
$$;
drop trigger if exists articles_require_leaf_category on public.articles;
create trigger articles_require_leaf_category before insert or update of category_id on public.articles
for each row execute function public.require_leaf_article_category();

create or replace function public.prevent_child_below_article_category() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.parent_id is not null and exists (select 1 from public.articles where category_id = new.parent_id) then
    raise exception 'A category containing articles cannot have children';
  end if;
  return new;
end;
$$;
drop trigger if exists categories_require_article_leaf on public.categories;
create trigger categories_require_article_leaf before insert or update of parent_id on public.categories
for each row execute function public.prevent_child_below_article_category();

drop function if exists public.increment_article_views(uuid);
create function public.increment_article_views(target_id uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare updated_count bigint;
begin
  update public.articles
  set view_count = view_count + 1
  where id = target_id and status = 'published'
  returning view_count into updated_count;
  return updated_count;
end;
$$;
revoke all on function public.increment_article_views(uuid) from public, anon, authenticated;
grant execute on function public.increment_article_views(uuid) to service_role;

create or replace function public.cleanup_expired_article_previews() returns integer
language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  delete from public.article_previews where expires_at < now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function public.cleanup_expired_article_previews() from public, anon, authenticated;
grant execute on function public.cleanup_expired_article_previews() to service_role;

create or replace function public.published_category_ids() returns table(id uuid)
language sql stable security definer set search_path = '' as $$
  with recursive public_categories(id, parent_id) as (
    select c.id, c.parent_id
    from public.categories c
    where exists (select 1 from public.articles a where a.category_id = c.id and a.status = 'published')
    union
    select parent.id, parent.parent_id
    from public.categories parent
    join public_categories child on child.parent_id = parent.id
  )
  select distinct public_categories.id from public_categories;
$$;
revoke all on function public.published_category_ids() from public;
grant execute on function public.published_category_ids() to anon, authenticated;

