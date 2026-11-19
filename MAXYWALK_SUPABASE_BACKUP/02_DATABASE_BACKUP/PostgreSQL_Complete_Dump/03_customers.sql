-- =============================================================================
-- DATA DUMP: customers (13 records)
-- =============================================================================

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1790272617143', '2d801db2-b9bc-4905-b436-ef51afb2a4ab'::uuid, 'Gokul Nath', 'gokul392005@gmail.com', '', '2026-09-24T17:56:57.143+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1790272615080', '6c3a8e0b-d85b-4951-a691-50aec50048c6'::uuid, 'Rajesh .k', 'k.rajesh13042006@gmail.com', '', '2026-09-24T17:56:55.08+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1790091331785', 'a800d801-b4bf-4751-8490-740d2fa5fe4a'::uuid, 'Adhithyan', 'adhithyanj07@gmail.com', '+91 98765 43210', '2026-09-22T15:35:31.785+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1790009184309', '05e99293-3e0a-4819-95ca-0802a94cdff3'::uuid, 'prabhu prabu', 'prabhujake@gmail.com', '', '2026-09-21T16:46:24.309+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789749102774', '7a542316-e8e3-4110-8966-cc277ee2dec5'::uuid, 'Zabbro', 'zabbrotechnologies@gmail.com', '', '2026-09-18T16:31:42.774+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789573403517', '49eef88b-1eee-4df2-a61e-6df8b159eb7f'::uuid, 'Gowshigan V', 'gowshigan20805@gmail.com', '', '2026-09-16T15:43:23.517+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789193123954', '9e2329ae-f9e3-4167-a0f7-7d7e1de77513'::uuid, 'Ver Host', 'info.verhost@gmail.com', '', '2026-09-12T06:05:23.954+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789192400744', 'f3dafdbc-6f7b-4afd-a535-3acc3086414a'::uuid, 'NARESH KUMAR M', 'nareshkumarm583225243063@nprcolleges.org', '', '2026-09-12T05:53:20.744+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789122558947', '4baa13f6-2243-4206-9bf3-ccf35a019c51'::uuid, 'SANJAY S', 's.sanjay.01.03.2006@gmail.com', '8248957918', '2026-09-11T10:29:18.947+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789121386679', '418c5fe7-8b66-4aa5-9442-48e0e2f42e20'::uuid, 'muthu v', 'muthuvelv3032@gmail.com', '', '2026-09-11T10:09:46.679+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789120185408', 'f5ed8c26-19e0-4b54-a39a-8d2ddee4540f'::uuid, 'Sanjay S', 's.sanjayeffort@gmail.com', '8248957918', '2026-09-11T09:49:45.408+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789120130680', 'cf2120bd-1c92-43e1-b973-1572ea141cbe'::uuid, 'Sanjay .S', 'sanjaysamsung001@gmail.com', '', '2026-09-11T09:48:50.68+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;

INSERT INTO public.customers (id, uid, name, email, phone, created_at)
VALUES ('cust-1789016804487', '5f14a167-4dda-4591-a81b-8942ee47ff72'::uuid, 'V. Kowshik', 'sathyakalasathyakala112@gmail.com', '+91 98765 43210', '2026-09-10T05:06:44.487+00:00')
ON CONFLICT (id) DO UPDATE SET
    uid = EXCLUDED.uid, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, created_at = EXCLUDED.created_at;
