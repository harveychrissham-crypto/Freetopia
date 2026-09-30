create or replace function public.create_message_request(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_id uuid := auth.uid();
  conversation_id uuid;
  target_status text;
begin
  if sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_user_id is null or target_user_id = sender_id then
    raise exception 'Choose another Freetopia member';
  end if;

  select cm.request_status
    into target_status
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  where c.kind = 'direct'
    and cm.user_id = target_user_id
    and exists (
      select 1
      from public.conversation_members mine
      where mine.conversation_id = c.id
        and mine.user_id = sender_id
    )
  order by c.created_at desc
  limit 1;

  select c.id
    into conversation_id
  from public.conversations c
  where c.kind = 'direct'
    and exists (
      select 1 from public.conversation_members a
      where a.conversation_id = c.id and a.user_id = sender_id
    )
    and exists (
      select 1 from public.conversation_members b
      where b.conversation_id = c.id and b.user_id = target_user_id
    )
  order by c.created_at desc
  limit 1;

  if conversation_id is not null then
    if target_status is null or target_status = 'declined' then
      update public.conversation_members cm
      set request_status = 'pending',
          is_archived = false
      where cm.conversation_id = create_message_request.conversation_id
        and cm.user_id = target_user_id;
    end if;
    return conversation_id;
  end if;

  insert into public.conversations (kind)
  values ('direct')
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id, request_status)
  values
    (conversation_id, sender_id, 'accepted'),
    (conversation_id, target_user_id, 'pending');

  insert into public.notifications (recipient_id, actor_id, type, conversation_id)
  values (target_user_id, sender_id, 'message', conversation_id);

  return conversation_id;
end;
$$;

grant execute on function public.create_message_request(uuid) to authenticated;
