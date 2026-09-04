-- Invite codes are redeemed only through the rate-limited join-trip edge
-- function. The browser must not be able to call this RPC with the publishable key.

drop function if exists public.join_trip_with_code(text, text);
drop function if exists public.join_trip_with_code(text, text, uuid);

create or replace function public.join_trip_with_code(
  raw_code text,
  member_display_name text,
  joining_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text;
  invitation public.trip_invitations;
  trimmed_name text;
  inserted_count integer;
begin
  if joining_user_id is null then
    raise exception 'Authentication required';
  end if;

  normalized_code := upper(trim(raw_code));
  trimmed_name := left(trim(member_display_name), 60);

  if normalized_code = '' or trimmed_name = '' then
    raise exception 'Code and display name are required';
  end if;

  select *
  into invitation
  from public.trip_invitations
  where code_hash = encode(
      extensions.digest(convert_to(normalized_code, 'UTF8'), 'sha256'),
      'hex'
    )
    and revoked_at is null
    and expires_at > now()
    and (max_uses is null or use_count < max_uses)
  order by created_at desc
  limit 1
  for update;

  if invitation.id is null then
    raise exception 'Invitation invalid or expired';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (invitation.trip_id, joining_user_id, 'member')
  on conflict (trip_id, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  insert into public.profiles (user_id, display_name)
  values (joining_user_id, trimmed_name)
  on conflict (user_id) do update
  set display_name = excluded.display_name;

  if inserted_count > 0 then
    update public.trip_invitations
    set use_count = use_count + 1
    where id = invitation.id;
  end if;

  return invitation.trip_id;
end;
$$;

revoke all on function public.join_trip_with_code(text, text, uuid) from public, anon, authenticated;
grant execute on function public.join_trip_with_code(text, text, uuid) to service_role;

create or replace function public.join_trip_with_token(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.trip_invitations;
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into invitation
  from public.trip_invitations
  where token_hash = encode(
      extensions.digest(convert_to(raw_token, 'UTF8'), 'sha256'),
      'hex'
    )
    and revoked_at is null
    and expires_at > now()
    and (max_uses is null or use_count < max_uses)
  for update;

  if invitation.id is null then
    raise exception 'Invitation invalid or expired';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (invitation.trip_id, auth.uid(), 'member')
  on conflict (trip_id, user_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.trip_invitations
    set use_count = use_count + 1
    where id = invitation.id;
  end if;

  return invitation.trip_id;
end;
$$;
