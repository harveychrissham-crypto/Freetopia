create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  constraint comment_reactions_one_per_user unique (comment_id,user_id)
);
create index if not exists comment_reactions_comment_id_idx on public.comment_reactions(comment_id);
alter table public.comment_reactions enable row level security;
drop policy if exists "Comment reactions are visible to authenticated users" on public.comment_reactions;
create policy "Comment reactions are visible to authenticated users" on public.comment_reactions for select to authenticated using (true);
drop policy if exists "Users can create their own comment reaction" on public.comment_reactions;
create policy "Users can create their own comment reaction" on public.comment_reactions for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can change their own comment reaction" on public.comment_reactions;
create policy "Users can change their own comment reaction" on public.comment_reactions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users can remove their own comment reaction" on public.comment_reactions;
create policy "Users can remove their own comment reaction" on public.comment_reactions for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.comment_reactions to authenticated;
alter publication supabase_realtime add table public.comment_reactions;
