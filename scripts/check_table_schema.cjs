const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bkvkhsiutpnhownwoskh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdmtoc2l1dHBuaG93bndvc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTg5OTQsImV4cCI6MjA3NTM5NDk5NH0.EFx_FQmyo6Vk4iV32N0__yQFQpCuFZXj7gIX1OZD_WM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking Database Tables ---');

    // Supabase js client doesn't give direct access to information_schema with simple queries usually restricted by RLS
    // But we can try to "rpc" if available, or just standard query if RLS allows reading information_schema (unlikely for anon)
    // Instead, let's just try to select from 'projects' and 'Projects' and see what happens.

    console.log('Attempting to select from "projects" (lowercase)...');
    const { data: d1, error: e1 } = await supabase.from('projects').select('id').limit(1);
    if (e1) console.log('Error selecting from "projects":', e1.message);
    else console.log('Success selecting from "projects". Found:', d1);

    console.log('\nAttempting to select from "Projects" (Capitalized)...');
    const { data: d2, error: e2 } = await supabase.from('Projects').select('id').limit(1);
    if (e2) console.log('Error selecting from "Projects":', e2.message);
    else console.log('Success selecting from "Projects". Found:', d2);

}

checkSchema();
