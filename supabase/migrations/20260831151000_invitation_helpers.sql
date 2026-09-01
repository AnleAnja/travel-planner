create or replace function public.create_trip_invitation(
  requested_trip_id uuid,
  valid_for interval default interval '14 days',
  allowed_uses integer default null
)
returns table (token text, code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  raw_code text;
  expiry timestamptz;
begin
  if not public.is_trip_owner(requested_trip_id) then
    raise exception 'Owner permission required';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  raw_code := upper(substr(encode(extensions.gen_random_bytes(6), 'base64'), 1, 6));
  raw_code := translate(raw_code, '/+=0OIL', 'ABCDEFG');
  expiry := now() + least(valid_for, interval '90 days');

  insert into public.trip_invitations (
    trip_id,
    token_hash,
    code_hash,
    created_by,
    expires_at,
    max_uses
  ) values (
    requested_trip_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    encode(extensions.digest(raw_code, 'sha256'), 'hex'),
    auth.uid(),
    expiry,
    allowed_uses
  );

  return query select raw_token, raw_code, expiry;
end;
$$;

grant execute on function public.create_trip_invitation(uuid, interval, integer) to authenticated;
