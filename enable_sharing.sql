-- Allow anyone (public/anon) to read projects
-- This is required for participants to view the project details via a shared link.
CREATE POLICY "Enable public read access" ON "projects" FOR SELECT USING (true);

-- Allow anyone to read app settings
-- This ensures the "Sign Up" button visibility is consistent for guests.
CREATE POLICY "Enable public read settings" ON "app_settings" FOR SELECT USING (true);
