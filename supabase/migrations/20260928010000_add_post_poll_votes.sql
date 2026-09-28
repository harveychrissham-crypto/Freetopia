create table if not exists public.post_poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  option_id uuid not null references public.post_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_poll_votes_one_vote_per_user unique (post_id, user_id)
);

create index if not exists post_poll_votes_post_id_idx on public.post_poll_votes(post_id);
create index if not exists post_poll_votes_option_id_idx on public.post_poll_votes(option_id);
create index if not exists post_poll_votes_user_id_idx on public.post_poll_votes(user_id);

alter table public.post_poll_votes enable row level security;

drop policy if exists "Poll votes are visible to authenticated users" on public.post_poll_votes;
create policy "Poll votes are visible to authenticated users"
on public.post_poll_votes for select
to authenticated
using (true);

drop policy if exists "Users can create their own poll vote" on public.post_poll_votes;
create policy "Users can create their own poll vote"
on public.post_poll_votes for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.post_poll_options o
    where o.id = option_id and o.post_id = post_id
  )
);

drop policy if exists "Users can change their own poll vote" on public.post_poll_votes;
create policy "Users can change their own poll vote"
on public.post_poll_votes for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.post_poll_options o
    where o.id = option_id and o.post_id = post_id
  )
);

drop policy if exists "Users can remove their own poll vote" on public.post_poll_votes;
create policy "Users can remove their own poll vote"
on public.post_poll_votes for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.post_poll_votes to authenticated;
