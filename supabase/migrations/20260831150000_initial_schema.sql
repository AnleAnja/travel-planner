create extension if not exists pgcrypto;

create type public.trip_role as enum ('owner', 'member');
create type public.packing_visibility as enum ('shared', 'private');
create type public.booking_type as enum (
  'accommodation',
  'flight',
  'train',
  'rental',
  'activity',
  'other'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  destination text not null check (char_length(destination) between 1 and 160),
  latitude double precision,
  longitude double precision,
  starts_on date not null,
  ends_on date not null,
  timezone text not null default 'UTC',
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  archived_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_dates_valid check (ends_on >= starts_on)
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.trip_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day date not null,
  title text,
  unique (trip_id, day)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day date not null,
  starts_at time,
  title text not null check (char_length(title) between 1 and 160),
  location_url text not null default '' check (
    location_url = '' or location_url ~ '^https://'
  ),
  notes text not null default '',
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  booking_type public.booking_type not null default 'other',
  title text not null check (char_length(title) between 1 and 160),
  provider text not null default '',
  confirmation_number text not null default '',
  starts_at timestamp not null,
  ends_at timestamp,
  location text not null default '',
  booking_url text not null default '' check (
    booking_url = '' or booking_url ~ '^https://'
  ),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates_valid check (
    ends_at is null or ends_at >= starts_at
  )
);

create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  category text not null default 'Sonstiges',
  visibility public.packing_visibility not null default 'shared',
  owner_user_id uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  packed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 160),
  amount_cents bigint not null check (amount_cents > 0),
  paid_by uuid not null references auth.users(id),
  expense_date date not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_shares (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  amount_cents bigint not null check (amount_cents >= 0),
  primary key (expense_id, user_id)
);

create table public.weather_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index trip_members_user_id_idx on public.trip_members(user_id);
create index activities_trip_day_idx on public.activities(trip_id, day, starts_at);
create index bookings_trip_start_idx on public.bookings(trip_id, starts_at);
create index packing_items_trip_idx on public.packing_items(trip_id);
create index expenses_trip_date_idx on public.expenses(trip_id, expense_date);
create index invitations_code_hash_idx on public.trip_invitations(code_hash);

create or replace function public.is_trip_member(requested_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = requested_trip_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(requested_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = requested_trip_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;

create or replace function public.create_trip(
  trip_title text,
  trip_destination text,
  trip_starts_on date,
  trip_ends_on date,
  trip_timezone text default 'UTC',
  trip_currency text default 'EUR',
  trip_latitude double precision default null,
  trip_longitude double precision default null
)
returns public.trips
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_trip public.trips;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.trips (
    title, destination, starts_on, ends_on, timezone, currency,
    latitude, longitude, created_by
  ) values (
    trip_title, trip_destination, trip_starts_on, trip_ends_on,
    trip_timezone, trip_currency, trip_latitude, trip_longitude, auth.uid()
  ) returning * into created_trip;

  insert into public.trip_members (trip_id, user_id, role)
  values (created_trip.id, auth.uid(), 'owner');

  return created_trip;
end;
$$;

grant execute on function public.create_trip(text, text, date, date, text, text, double precision, double precision) to authenticated;

create or replace function public.join_trip_with_token(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.trip_invitations;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into invitation
  from public.trip_invitations
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and revoked_at is null
    and expires_at > now()
    and (max_uses is null or use_count < max_uses)
  for update;

  if invitation.id is null then
    raise exception 'Invitation invalid or expired';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (invitation.trip_id, auth.uid(), 'member')
  on conflict do nothing;

  update public.trip_invitations
  set use_count = use_count + 1
  where id = invitation.id;

  return invitation.trip_id;
end;
$$;

grant execute on function public.join_trip_with_token(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
alter table public.trip_days enable row level security;
alter table public.activities enable row level security;
alter table public.bookings enable row level security;
alter table public.packing_items enable row level security;
alter table public.trip_notes enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;
alter table public.weather_cache enable row level security;

create policy "profiles readable by shared trip members"
on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.trip_members mine
    join public.trip_members theirs on theirs.trip_id = mine.trip_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.user_id
  )
);
create policy "users manage own profile"
on public.profiles for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members read trips"
on public.trips for select to authenticated
using (public.is_trip_member(id));
create policy "owners update trips"
on public.trips for update to authenticated
using (public.is_trip_owner(id))
with check (public.is_trip_owner(id));
create policy "owners delete trips"
on public.trips for delete to authenticated
using (public.is_trip_owner(id));

create policy "members read memberships"
on public.trip_members for select to authenticated
using (public.is_trip_member(trip_id));
create policy "owners manage memberships"
on public.trip_members for delete to authenticated
using (public.is_trip_owner(trip_id) and user_id <> auth.uid());

create policy "owners manage invitations"
on public.trip_invitations for all to authenticated
using (public.is_trip_owner(trip_id))
with check (public.is_trip_owner(trip_id) and created_by = auth.uid());

create policy "members manage trip days"
on public.trip_days for all to authenticated
using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id));

create policy "members manage activities"
on public.activities for all to authenticated
using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id) and created_by = auth.uid());

create policy "members manage bookings"
on public.bookings for all to authenticated
using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id) and created_by = auth.uid());

create policy "members read allowed packing items"
on public.packing_items for select to authenticated
using (
  public.is_trip_member(trip_id)
  and (visibility = 'shared' or owner_user_id = auth.uid())
);
create policy "members create packing items"
on public.packing_items for insert to authenticated
with check (public.is_trip_member(trip_id) and owner_user_id = auth.uid());
create policy "owners manage own or shared packing items"
on public.packing_items for update to authenticated
using (
  public.is_trip_member(trip_id)
  and (visibility = 'shared' or owner_user_id = auth.uid())
)
with check (
  public.is_trip_member(trip_id)
  and (visibility = 'shared' or owner_user_id = auth.uid())
);
create policy "members delete own or shared packing items"
on public.packing_items for delete to authenticated
using (
  public.is_trip_member(trip_id)
  and (visibility = 'shared' or owner_user_id = auth.uid())
);

create policy "members manage notes"
on public.trip_notes for all to authenticated
using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id) and created_by = auth.uid());

create policy "members manage expenses"
on public.expenses for all to authenticated
using (public.is_trip_member(trip_id))
with check (
  public.is_trip_member(trip_id)
  and created_by = auth.uid()
  and exists (
    select 1 from public.trip_members
    where trip_id = expenses.trip_id and user_id = expenses.paid_by
  )
);

create policy "members manage expense shares"
on public.expense_shares for all to authenticated
using (
  exists (
    select 1 from public.expenses
    where expenses.id = expense_shares.expense_id
      and public.is_trip_member(expenses.trip_id)
  )
)
with check (
  exists (
    select 1
    from public.expenses
    join public.trip_members on trip_members.trip_id = expenses.trip_id
    where expenses.id = expense_shares.expense_id
      and public.is_trip_member(expenses.trip_id)
      and trip_members.user_id = expense_shares.user_id
  )
);

alter publication supabase_realtime add table
  public.trip_members,
  public.activities,
  public.bookings,
  public.packing_items,
  public.trip_notes,
  public.expenses,
  public.expense_shares;
