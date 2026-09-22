-- Optional development seed. The sample article remains a draft.
with branch as (
  insert into public.categories (name, slug, description, sort_order)
  values ('ЕГЭ', 'ege', 'Подготовка к единому государственному экзамену', 1)
  returning id
), subject as (
  insert into public.categories (name, slug, parent_id, description)
  select 'Информатика', 'informatika', id, 'Темы ЕГЭ по информатике' from branch
  returning id
), topic as (
  insert into public.categories (name, slug, parent_id, description)
  select 'Задание 12', 'zadanie-12', id, 'Разбор задания 12' from subject
  returning id
)
insert into public.articles (title, slug, excerpt, content_json, content_html, category_id)
select 'Черновик: как решать задание 12', 'kak-reshat-zadanie-12',
  'Демонстрационная статья для проверки редактора.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Замените этот текст перед публикацией."}]}]}'::jsonb,
  '<p>Замените этот текст перед публикацией.</p>', id from topic;
