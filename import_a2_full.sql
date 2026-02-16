
/* 
  IMPORT SCRIPT FOR PROJECT 'a2' AND RESULTS
  Run this in Supabase SQL Editor.
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- 1. Get the target user (latest user created)
  SELECT id INTO target_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users. Please Sign Up in the app first!';
  END IF;

  -- 2. Insert Project 'a2' (if not exists)
  INSERT INTO public.projects (id, name, type, cards, categories, user_id, created_at, updated_at)
  VALUES (
    '1759926505165',
    'a2',
    'closed',
    '["Network Map","Wi-Fi","WAN","LAN","Ethernet","GRE Tunnels","Firewall","Parental Controls","Port Triggering","Port Filtering","Port Forwarding","MAC Filtering","DMZ","VPN","Local UI Password","Speed Test","Wi-Fi Analyzer","Wi-Fi Score","Wi-Fi Diagnostics","Device Diagnostics","Device logs","Crash logs","Events & Alert history","Device Processes","DOCSIS Statistics","Firmware","Back up & Restore","Advanced Services","NTP Server"]'::jsonb,
    '["Network","Security","Diagnostics","Troubleshooting","Settings","Voice"]'::jsonb,
    target_user_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id, -- Re-assign to current user if needed
    updated_at = now();

  -- 3. Insert Results

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'fdd5e5e0-2156-4d97-866e-e2c114a284de',
    '1759926505165',
    'psandeepreddy060619@gmail.com',
    '{"email":"psandeepreddy060619@gmail.com","categories":[{"cards":["Wi-Fi","Network Map","MAC Filtering","Device Diagnostics","Firmware"],"category_name":"Network"},{"cards":["LAN","GRE Tunnels","Local UI Password","Device logs","Back up & Restore"],"category_name":"Security"},{"cards":["Ethernet","WAN","VPN","Wi-Fi Diagnostics","Events & Alert history","Advanced Services"],"category_name":"Diagnostics"},{"cards":["Firewall","Port Triggering","Wi-Fi Analyzer","Device Processes"],"category_name":"Troubleshooting"},{"cards":["Parental Controls","Port Forwarding","Speed Test","DOCSIS Statistics"],"category_name":"Settings"},{"cards":["Port Filtering","DMZ","Wi-Fi Score","Crash logs","NTP Server"],"category_name":"Voice"}]}'::jsonb,
    '2026-01-14T08:20:03.993209+00:00',
    '2026-01-14T08:20:03.993209+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    '8a9ea2a3-e368-4546-ae80-1c35f0999762',
    '1759926505165',
    'shekhar@gmail.com',
    '{"email":"shekhar@gmail.com","categories":[{"cards":["WAN","Ethernet","Firewall","Port Triggering","Port Filtering","VPN","Local UI Password","Wi-Fi Analyzer","Wi-Fi Score","Device Diagnostics","Device logs","Firmware","Port Forwarding","Device Processes","Advanced Services","Wi-Fi Diagnostics"],"category_name":"Network"},{"cards":["GRE Tunnels","Parental Controls","LAN","Crash logs","DOCSIS Statistics","Network Map"],"category_name":"Security"},{"cards":["Wi-Fi","Speed Test","MAC Filtering","NTP Server"],"category_name":"Diagnostics"},{"cards":["DMZ"],"category_name":"Troubleshooting"},{"cards":["Events & Alert history"],"category_name":"Settings"},{"cards":["Back up & Restore"],"category_name":"Voice"}]}'::jsonb,
    '2025-10-14T08:32:22.395175+00:00',
    '2025-10-14T08:32:22.395175+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    '6091296e-cf22-422e-af9d-b1cd880bfcb4',
    '1759926505165',
    '123@kodh.com',
    '{"email":"123@kodh.com","categories":[{"cards":["Wi-Fi","Parental Controls","Port Forwarding","Ethernet","Local UI Password","Device logs","Device Diagnostics","WAN","Events & Alert history","Firmware"],"category_name":"Network"},{"cards":["LAN","GRE Tunnels","Firewall","MAC Filtering","Crash logs","Back up & Restore"],"category_name":"Security"},{"cards":["Port Filtering","Speed Test","VPN","Device Processes"],"category_name":"Diagnostics"},{"cards":["Wi-Fi Analyzer","Network Map","DMZ"],"category_name":"Troubleshooting"},{"cards":["Port Triggering","Wi-Fi Score","Advanced Services"],"category_name":"Settings"},{"cards":["Wi-Fi Diagnostics","DOCSIS Statistics","NTP Server"],"category_name":"Voice"}]}'::jsonb,
    '2025-10-10T09:34:15.106207+00:00',
    '2025-10-10T09:34:15.106207+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'a65315ad-98a8-4bb9-96b8-2620cab4b039',
    '1759926505165',
    'jsmith@example.com',
    '{"email":"jsmith@example.com","categories":[{"cards":["WAN"],"category_name":"Network"},{"cards":["Ethernet"],"category_name":"Security"}]}'::jsonb,
    '2025-10-10T08:20:07.528735+00:00',
    '2025-10-10T08:20:07.528735+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'd1073a56-9a06-425e-9812-58e4aaace4d8',
    '1759926505165',
    'ioio@gmail.com',
    '{"email":"ioio@gmail.com","categories":[{"cards":["GRE Tunnels","Parental Controls","Port Filtering","Port Forwarding"],"category_name":"Troubleshooting"}]}'::jsonb,
    '2025-10-09T20:27:41.690079+00:00',
    '2025-10-09T20:27:41.690079+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'cc6fda5a-a91d-4321-91a2-3af6e65b5c0f',
    '1759926505165',
    'kool@gmail.com',
    '{"email":"kool@gmail.com","categories":[{"cards":["Firewall"],"category_name":"Network"},{"cards":["Port Triggering"],"category_name":"Security"},{"cards":["Port Filtering"],"category_name":"Diagnostics"},{"cards":["Parental Controls"],"category_name":"Troubleshooting"},{"cards":["Port Forwarding"],"category_name":"Settings"},{"cards":["MAC Filtering"],"category_name":"Voice"}]}'::jsonb,
    '2025-10-09T20:26:59.640242+00:00',
    '2025-10-09T20:26:59.640242+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'e42d8a27-d896-4382-b3ab-d4a7c223bf30',
    '1759926505165',
    '123kid@gmail.com',
    '{"email":"123kid@gmail.com","categories":[{"cards":["Firewall","Network Map","WAN","GRE Tunnels"],"category_name":"Network"},{"cards":["Port Filtering","Parental Controls","Port Forwarding"],"category_name":"Security"}]}'::jsonb,
    '2025-10-09T20:04:42.864048+00:00',
    '2025-10-09T20:04:42.864048+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    'dfce1bbe-2f9d-4430-a3a5-8c15cb2f6584',
    '1759926505165',
    '123s@gmail.com',
    '{"email":"123s@gmail.com","categories":[{"cards":["WAN","Ethernet"],"category_name":"Network"}]}'::jsonb,
    '2025-10-09T20:03:21.904795+00:00',
    '2025-10-09T20:03:21.904795+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    '7d63c427-c9c7-4b90-b80c-d5728b9c2323',
    '1759926505165',
    'abigalrani@gmail.com',
    '{"email":"abigalrani@gmail.com","categories":[{"cards":["WAN","Network Map","LAN","GRE Tunnels","Firewall","Parental Controls","Wi-Fi Analyzer","Device logs"],"category_name":"Network"},{"cards":["Port Triggering","Port Filtering","Speed Test","DMZ","Wi-Fi"],"category_name":"Security"},{"cards":["Port Forwarding","Back up & Restore","Events & Alert history"],"category_name":"Diagnostics"},{"cards":["Local UI Password","Wi-Fi Score","Wi-Fi Diagnostics","NTP Server"],"category_name":"Troubleshooting"},{"cards":["Device Diagnostics","DOCSIS Statistics","Firmware","Advanced Services"],"category_name":"Settings"},{"cards":["Crash logs","MAC Filtering","Device Processes","VPN","Ethernet"],"category_name":"Voice"}]}'::jsonb,
    '2025-10-08T13:15:51.214114+00:00',
    '2025-10-08T13:15:51.214114+00:00'
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
