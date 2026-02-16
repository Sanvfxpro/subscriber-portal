const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bkvkhsiutpnhownwoskh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdmtoc2l1dHBuaG93bndvc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTg5OTQsImV4cCI6MjA3NTM5NDk5NH0.EFx_FQmyo6Vk4iV32N0__yQFQpCuFZXj7gIX1OZD_WM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDelete() {
    console.log('--- Debugging Delete Functionality ---');

    // 1. List all projects to see what's there
    const { data: projects, error: listError } = await supabase
        .from('projects')
        .select('id, name, deleted_at');

    if (listError) {
        console.error('Error listing projects:', listError);
        return;
    }

    console.log(`Found ${projects.length} projects.`);
    projects.forEach(p => console.log(` - [${p.id}] "${p.name}" (Deleted: ${p.deleted_at})`));

    // 2. Find target projects
    const targetNames = ['Subscriber Portal - Option B', 'Test Project', 'test project']; // Add variations
    const targets = projects.filter(p => targetNames.some(n => p.name.toLowerCase().includes(n.toLowerCase())));

    if (targets.length === 0) {
        console.log('\nCould not find "Subscriber Portal - Option B" or "Test Project" to test with.');
        return;
    }

    console.log('\nTarget Projects found:', targets.map(t => t.name));

    // 3. Try to "Soft Delete" the first target (UPDATE deleted_at)
    // We won't commit if we can make it fail, or we will rollback manually if it succeeds?
    // Actually, user said "try on only... dont delete project". 
    // Code-wise, "delete" IS setting deleted_at. 
    // I will just TRY the update key and see if it throws schema error.

    const target = targets[0];
    console.log(`\nAttempting to update 'deleted_at' for project: "${target.name}" (${target.id})...`);

    const { error: updateError } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', target.id);

    if (updateError) {
        console.error('FAIL: Update failed. This confirms the issue.');
        console.error('Error details:', updateError);
    } else {
        console.log('SUCCESS: Update succeeded. The column exists.');

        // revert it so we don't actually delete it against user wishes?
        // User said "dont delete project" but also "try on ...". 
        // I will revert it immediately to be safe.
        console.log('Reverting change...');
        await supabase.from('projects').update({ deleted_at: null }).eq('id', target.id);
        console.log('Reverted.');
    }
}

debugDelete();
