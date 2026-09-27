alter table public.post_media
  add column if not exists processing_status text not null default 'ready',
  add column if not exists playback_url text,
  add column if not exists thumbnail_path text;

alter table public.post_media
  drop constraint if exists post_media_processing_status_check;

alter table public.post_media
  add constraint post_media_processing_status_check
  check (processing_status in ('uploading','processing','ready','failed'));
