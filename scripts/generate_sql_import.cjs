const fs = require('fs');
const path = require('path');

function generateSql() {
    const dataPath = path.join(__dirname, 'manual_results_a2.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const p = data.project;
    const results = data.results;

    // Escape single quotes for SQL
    const safeStr = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
    const safeJson = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'`;

    // Project ID should be text based on schema (id text PRIMARY KEY)
    // In JSON it is a number, we convert to string.
    const projectId = String(p.project_id);

    let sql = `
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
    '${projectId}',
    ${safeStr(p.name)},
    ${safeStr(p.type)},
    ${safeJson(p.cards)}::jsonb,
    ${safeJson(p.categories)}::jsonb,
    target_user_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id, -- Re-assign to current user if needed
    updated_at = now();

  -- 3. Insert Results
`;

    results.forEach(r => {
        sql += `
  INSERT INTO public.sorting_results (id, project_id, participant_email, result_data, created_at, updated_at)
  VALUES (
    ${safeStr(r.id)},
    '${projectId}',
    ${safeStr(r.email)},
    ${safeJson({ email: r.email, categories: r.categories })}::jsonb,
    ${safeStr(r.createdAt || new Date().toISOString())},
    ${safeStr(r.createdAt || new Date().toISOString())}
  )
  ON CONFLICT (id) DO NOTHING;
`;
    });

    sql += `
END $$;
`;

    const outPath = path.join(__dirname, '..', 'import_a2_full.sql');
    fs.writeFileSync(outPath, sql);
    console.log('SQL generated at:', outPath);
}

generateSql();
