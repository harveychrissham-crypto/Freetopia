create or replace function public.create_social_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  recipient uuid;
begin
  if tg_table_name = 'post_reactions' and tg_op = 'INSERT' then
    select p.author_id into recipient from public.posts p where p.id = new.post_id;
    if recipient is not null and recipient <> new.user_id then
      insert into public.notifications(recipient_id, actor_id, type, post_id)
      values (recipient, new.user_id, 'reaction', new.post_id);
    end if;
  elsif tg_table_name = 'comments' and tg_op = 'INSERT' then
    if new.parent_id is not null then
      select c.author_id into recipient from public.comments c where c.id = new.parent_id;
    end if;
    if recipient is null then
      select p.author_id into recipient from public.posts p where p.id = new.post_id;
    end if;
    if recipient is not null and recipient <> new.author_id then
      insert into public.notifications(recipient_id, actor_id, type, post_id, comment_id)
      values (recipient, new.author_id, 'comment', new.post_id, new.id);
    end if;
  elsif tg_table_name = 'comment_reactions' and tg_op = 'INSERT' then
    select c.author_id into recipient from public.comments c where c.id = new.comment_id;
    if recipient is not null and recipient <> new.user_id then
      insert into public.notifications(recipient_id, actor_id, type, post_id, comment_id)
      values (recipient,new.user_id,'reaction',(select c.post_id from public.comments c where c.id=new.comment_id),new.comment_id);
    end if;
  elsif tg_table_name = 'follows' and tg_op = 'INSERT' then
    if new.status = 'accepted' and new.follower_id <> new.following_id then
      insert into public.notifications(recipient_id, actor_id, type)
      values (new.following_id, new.follower_id, 'follow');
    end if;
  elsif tg_table_name = 'messages' and tg_op = 'INSERT' then
    for recipient in
      select cm.user_id from public.conversation_members cm
      where cm.conversation_id = new.conversation_id
        and cm.user_id <> new.sender_id
        and cm.request_status = 'accepted'
        and coalesce(cm.is_muted,false) = false
    loop
      insert into public.notifications(recipient_id, actor_id, type, conversation_id)
      values (recipient, new.sender_id, 'message', new.conversation_id);
    end loop;
  end if;
  return new;
end;
$function$;

drop trigger if exists comments_notify_activity on public.comments;
drop trigger if exists comment_reactions_notify_activity on public.comment_reactions;
drop trigger if exists comment_reaction_notification on public.comment_reactions;
create trigger comment_reaction_notification after insert on public.comment_reactions for each row execute function public.create_social_notification();
