grant usage on schema public to anon, authenticated;

grant select on public.tournaments to anon, authenticated;
grant insert, update, delete on public.tournaments to authenticated;

grant usage, select on sequence public.tournaments_id_seq to authenticated;

grant select on public.admin_profiles to authenticated;
