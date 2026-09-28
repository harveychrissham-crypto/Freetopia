create or replace function public.notify_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recipient uuid;
begin
  if new.author_id is null then return new; end if;
  if new.parent_id is not null then select author_id into recipient from public.comments where id=new.parent_id; end if;
  if recipient is null then select author_id into recipient from public.posts where id=new.post_id; end if;
  if recipient is null or recipient=new.author_id then return new; end if;
  insert into public.notifications(recipient_id,actor_id,type,post_id,comment_id)
  select recipient,new.author_id,'comment',new.post_id,new.id
  where not exists (select 1 from public.notifications n where n.recipient_id=recipient and n.actor_id=new.author_id and n.type='comment' and n.comment_id=new.id);
  return new;
end;
$$;

drop trigger if exists comments_notify_activity on public.comments;
create trigger comments_notify_activity after insert on public.comments for each row execute function public.notify_comment_activity();

create or replace function public.notify_comment_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare recipient uuid; post_ref uuid;
begin
  select c.author_id,c.post_id into recipient,post_ref from public.comments c where c.id=new.comment_id;
  if recipient is null or recipient=new.user_id then return new; end if;
  insert into public.notifications(recipient_id,actor_id,type,post_id,comment_id)
  select recipient,new.user_id,'reaction',post_ref,new.comment_id
  where not exists (
    select 1 from public.notifications n
    where n.recipient_id=recipient and n.actor_id=new.user_id and n.type='reaction'
      and n.comment_id=new.comment_id and n.created_at > now() - interval '1 second'
  );
  return new;
end;
$$;

drop trigger if exists comment_reactions_notify_activity on public.comment_reactions;
create trigger comment_reactions_notify_activity after insert on public.comment_reactions for each row execute function public.notify_comment_reaction();
