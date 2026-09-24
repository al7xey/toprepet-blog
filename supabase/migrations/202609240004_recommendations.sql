create table if not exists public.article_recommendations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  recommended_article_id uuid not null references public.articles(id) on delete cascade,
  sort_order integer not null check (sort_order between 0 and 2),
  created_at timestamptz not null default now(),
  constraint article_recommendations_not_self check (article_id <> recommended_article_id),
  constraint article_recommendations_pair_unique unique (article_id, recommended_article_id),
  constraint article_recommendations_order_unique unique (article_id, sort_order)
);

create index if not exists article_recommendations_article_idx on public.article_recommendations(article_id, sort_order);
alter table public.article_recommendations enable row level security;

create policy "Public reads published recommendations" on public.article_recommendations for select using (
  exists (select 1 from public.articles source where source.id = article_id and source.status = 'published')
  and exists (select 1 from public.articles target where target.id = recommended_article_id and target.status = 'published')
);
create policy "Admins manage recommendations" on public.article_recommendations for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

create or replace function public.blog_admin_total_views()
returns bigint language plpgsql security definer set search_path = public as $$
begin
  if not public.is_blog_admin() then raise exception 'forbidden'; end if;
  return coalesce((select sum(view_count) from public.articles), 0);
end;
$$;
revoke all on function public.blog_admin_total_views() from public;
grant execute on function public.blog_admin_total_views() to authenticated;
