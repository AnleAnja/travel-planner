begin;
select plan(10);

select has_function(
  'public',
  'join_trip_with_code',
  array['text', 'text', 'uuid'],
  'Join uses the service-role signature with a user id'
);

select hasnt_function(
  'public',
  'join_trip_with_code',
  array['text', 'text'],
  'Authenticated clients cannot call a two-argument join'
);

select is(
  has_function_privilege(
    'authenticated',
    'public.join_trip_with_code(text, text, uuid)',
    'execute'
  ),
  false,
  'authenticated cannot execute join_trip_with_code'
);

select is(
  has_function_privilege(
    'anon',
    'public.join_trip_with_code(text, text, uuid)',
    'execute'
  ),
  false,
  'anon cannot execute join_trip_with_code'
);

select is(
  has_function_privilege(
    'service_role',
    'public.join_trip_with_code(text, text, uuid)',
    'execute'
  ),
  true,
  'service_role can execute join_trip_with_code'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@test.local',
    extensions.crypt('pass', extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'guest@test.local',
    extensions.crypt('pass', extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

insert into public.trips (
  id, title, destination, starts_on, ends_on, created_by
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Test trip',
  'Lisbon',
  current_date,
  current_date + 3,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

insert into public.trip_members (trip_id, user_id, role) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'owner'
);

insert into public.trip_invitations (
  trip_id,
  token_hash,
  code_hash,
  created_by,
  expires_at,
  max_uses,
  use_count
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  encode(extensions.digest(convert_to('token', 'UTF8'), 'sha256'), 'hex'),
  encode(extensions.digest(convert_to('ABCDEF', 'UTF8'), 'sha256'), 'hex'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  now() + interval '7 days',
  5,
  0
);

select is(
  public.join_trip_with_code(
    'ABCDEF',
    'Sam',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  ),
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  'A valid code adds the member and returns the trip'
);

select is(
  (
    select use_count
    from public.trip_invitations
    where code_hash = encode(
      extensions.digest(convert_to('ABCDEF', 'UTF8'), 'sha256'),
      'hex'
    )
  ),
  1,
  'First join increments use_count'
);

select lives_ok(
  $$select public.join_trip_with_code(
    'ABCDEF',
    'Sam',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  )$$,
  'Rejoining an existing member succeeds'
);

select is(
  (
    select use_count
    from public.trip_invitations
    where code_hash = encode(
      extensions.digest(convert_to('ABCDEF', 'UTF8'), 'sha256'),
      'hex'
    )
  ),
  1,
  'Rejoining does not increment use_count'
);

insert into public.trip_invitations (
  trip_id,
  token_hash,
  code_hash,
  created_by,
  expires_at,
  revoked_at
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  encode(extensions.digest(convert_to('expired-token', 'UTF8'), 'sha256'), 'hex'),
  encode(extensions.digest(convert_to('ZZZZZZ', 'UTF8'), 'sha256'), 'hex'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  now() - interval '1 day',
  now()
);

select throws_ok(
  $$select public.join_trip_with_code(
    'ZZZZZZ',
    'Sam',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  )$$,
  'Invitation invalid or expired',
  'Expired or revoked codes are rejected'
);

select * from finish();
rollback;
