create or replace function public.prevent_category_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id or exists (
    with recursive ancestors(id, parent_id) as (
      select category.id, category.parent_id
      from public.categories as category
      where category.id = new.parent_id
      union
      select category.id, category.parent_id
      from public.categories as category
      join ancestors on category.id = ancestors.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Category hierarchy cannot contain a cycle';
  end if;

  return new;
end;
$$;

drop trigger if exists categories_prevent_cycle on public.categories;
create trigger categories_prevent_cycle
before insert or update of parent_id on public.categories
for each row execute function public.prevent_category_cycle();

alter table public.articles
  add constraint articles_published_content_check
  check (
    status <> 'published'
    or (length(trim(excerpt)) > 0 and length(trim(content_html)) > 0)
  );

alter table public.articles
  add constraint articles_cover_alt_check
  check (
    cover_image_url is null
    or length(trim(coalesce(cover_image_alt, ''))) > 0
  );

update storage.buckets
set public = true,
    file_size_limit = 524288,
    allowed_mime_types = array['image/webp']
where id = 'article-images';

