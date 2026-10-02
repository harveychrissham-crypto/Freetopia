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
revoke execute on function public.get_message_requests() from public;
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
  update public.notifications set read_at=coalesce(read_at,now())
  where recipient_id=v_user_id and conversation_id=target_conversation_id and type='message' and read_at is null;
  return true;
end; $$;
revoke execute on function public.respond_to_message_request(uuid,boolean) from public;
grant execute on function public.respond_to_message_request(uuid,boolean) to authenticated;

notify pgrst, 'reload schema';
