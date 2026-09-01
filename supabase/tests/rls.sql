begin;
select plan(6);

select policies_are(
  'public',
  'trips',
  array['members read trips', 'owners update trips', 'owners delete trips'],
  'Trips expose only explicit member and owner policies'
);

select policies_are(
  'public',
  'packing_items',
  array[
    'members read allowed packing items',
    'members create packing items',
    'owners manage own or shared packing items',
    'members delete own or shared packing items'
  ],
  'Packing items have dedicated privacy policies'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.trip_members'::regclass),
  'RLS is enabled for memberships'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.expenses'::regclass),
  'RLS is enabled for expenses'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.packing_items'::regclass),
  'RLS is enabled for private packing items'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.bookings'::regclass),
  'RLS is enabled for booking details'
);

select * from finish();
rollback;
