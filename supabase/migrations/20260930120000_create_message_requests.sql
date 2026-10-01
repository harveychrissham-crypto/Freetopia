create or replace function public.create_message_request(target_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_sender_id uuid:=auth.uid(); v_conversation_id uuid; v_target_status text;
begin
  if v_sender_id is null then raise exception 'Not authenticated'; end if;
  if target_user_id is null or target_user_id=v_sender_id then raise exception 'Choose another Freetopia member'; end if;
  select c.id,cm.request_status into v_conversation_id,v_target_status
  from public.conversations c join public.conversation_members cm on cm.conversation_id=c.id
  where c.kind='direct' and cm.user_id=target_user_id
    and exists(select 1 from public.conversation_members mine where mine.conversation_id=c.id and mine.user_id=v_sender_id)
  order by c.created_at desc limit 1;
  if v_conversation_id is not null then
    if v_target_status is null or v_target_status='declined' then
      update public.conversation_members set request_status='pending',is_archived=false
      where conversation_id=v_conversation_id and user_id=target_user_id;
    end if;
    insert into public.notifications(recipient_id,actor_id,type,conversation_id)
    select target_user_id,v_sender_id,'message',v_conversation_id
    where not exists(select 1 from public.notifications n where n.recipient_id=target_user_id and n.actor_id=v_sender_id and n.type='message' and n.conversation_id=v_conversation_id and n.read_at is null);
    return v_conversation_id;
  end if;
  insert into public.conversations(kind) values('direct') returning id into v_conversation_id;
  insert into public.conversation_members(conversation_id,user_id,request_status)
  values(v_conversation_id,v_sender_id,'accepted'),(v_conversation_id,target_user_id,'pending');
  insert into public.notifications(recipient_id,actor_id,type,conversation_id) values(target_user_id,v_sender_id,'message',v_conversation_id);
  return v_conversation_id;
end; $$;
grant execute on function public.create_message_request(uuid) to authenticated;

create or replace function public.get_message_requests()
returns table(conversation_id uuid,requester_id uuid,created_at timestamptz,username text,display_name text,avatar_url text,bio text)
language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  return query
  select c.id,requester.user_id,c.created_at,p.username,p.display_name,p.avatar_url,p.bio
  from public.conversations c
  join public.conversation_members me on me.conversation_id=c.id and me.user_id=v_user_id and me.request_status='pending'
  join public.conversation_members requester on requester.conversation_id=c.id and requester.user_id<>v_user_id and requester.request_status='accepted'
  left join public.profiles p on p.id=requester.user_id
  where c.kind='direct' order by c.created_at desc;
end; $$;
grant execute on function public.get_message_requests() to authenticated;

create or replace function public.respond_to_message_request(target_conversation_id uuid,accept_request boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=auth.uid(); v_updated integer;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  update public.conversation_members
  set request_status=case when accept_request then 'accepted' else 'declined' end,
      is_archived=case when accept_request then false else true end
  where conversation_id=target_conversation_id and user_id=v_user_id and request_status='pending';
  get diagnostics v_updated=row_count;
  if v_updated=0 then raise exception 'Message request is no longer pending'; end if;
  if accept_request then
    update public.notifications set read_at=coalesce(read_at,now())
    where recipient_id=v_user_id and conversation_id=target_conversation_id and type='message' and read_at is null;
  end if;
  return true;
end; $$;
grant execute on function public.respond_to_message_request(uuid,boolean) to authenticated;