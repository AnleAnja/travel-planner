-- Invite join must work from the authenticated client with the same SQL hash
-- used when creating invitations. The edge function is no longer required.

drop function if exists public.create_trip_invitation(uuid, interval, integer);
drop function if exists public.join_trip_with_code(text, text, uuid);
drop function if exists public.join_trip_with_code(text, text);

create or replace function public.create_trip_invitation(
  requested_trip_id uuid,
  valid_for interval default interval '14 days',
  allowed_uses integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  raw_code text;
  expiry timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_trip_owner(requested_trip_id) then
    raise exception 'Owner permission required';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  raw_code := upper(substr(encode(extensions.gen_random_bytes(6), 'base64'), 1, 6));
  raw_code := translate(raw_code, '/+=0OIL', 'ABCDEFG');
  expiry := now() + least(valid_for, interval '90 days');

  update public.trip_invitations
  set revoked_at = now()
  where trip_id = requested_trip_id
    and revoked_at is null;

  insert into public.trip_invitations (
    trip_id,
    token_hash,
    code_hash,
    created_by,
    expires_at,
    max_uses
  ) values (
    requested_trip_id,
    encode(extensions.digest(convert_to(raw_token, 'UTF8'), 'sha256'), 'hex'),
    encode(extensions.digest(convert_to(raw_code, 'UTF8'), 'sha256'), 'hex'),
    auth.uid(),
    expiry,
    allowed_uses
  );

  return jsonb_build_object(
    'token', raw_token,
    'code', raw_code,
    'expires_at', expiry
  );
end;
$$;

grant execute on function public.create_trip_invitation(uuid, interval, integer) to authenticated;

create or replace function public.join_trip_with_code(
  raw_code text,
  member_display_name text
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
  joining_user_id uuid := auth.uid();
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
  where id = (
    select id
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
    for update
  );

  if invitation.id is null then
    raise exception 'Invitation invalid or expired';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (invitation.trip_id, joining_user_id, 'member')
  on conflict (trip_id, user_id) do nothing;

  insert into public.profiles (user_id, display_name)
  values (joining_user_id, trimmed_name)
  on conflict (user_id) do update
  set display_name = excluded.display_name;

  update public.trip_invitations
  set use_count = use_count + 1
  where id = invitation.id;

  return invitation.trip_id;
end;
$$;

grant execute on function public.join_trip_with_code(text, text) to authenticated;
