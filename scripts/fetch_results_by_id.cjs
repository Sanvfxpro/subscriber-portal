const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Configuration for OLD Project
const OLD_PROJECT_URL = 'https://bkvkhsiutpnhownwoskh.supabase.co';
const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdmtoc2l1dHBuaG93bndvc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTg5OTQsImV4cCI6MjA3NTM5NDk5NH0.EFx_FQmyo6Vk4iV32N0__yQFQpCuFZXj7gIX1OZD_WM';

const supabaseOld = createClient(OLD_PROJECT_URL, OLD_ANON_KEY);

const PROJECT_ID_A2 = '1759926505165';
const PROJECT_ID_SUPER = '1759926496568';

async function fetchResultsById() {
    console.log('Attempting to fetch results for specific Project IDs...');

    try {
        // Try A2
        const { data: resultsA2, error: errorA2 } = await supabaseOld
            .from('sorting_results')
            .select('*')
            .eq('project_id', PROJECT_ID_A2);

        if (errorA2) console.error('Error A2:', errorA2.message);
        else console.log(`Project A2 Results: ${resultsA2?.length || 0}`);

        // Try Super Project
        const { data: resultsSuper, error: errorSuper } = await supabaseOld
            .from('sorting_results')
            .select('*')
            .eq('project_id', PROJECT_ID_SUPER);

        if (errorSuper) console.error('Error Super:', errorSuper.message);
        else console.log(`Project Super Results: ${resultsSuper?.length || 0}`);

        const allResults = [...(resultsA2 || []), ...(resultsSuper || [])];

        if (allResults.length > 0) {
            const backupPath = path.join(__dirname, 'old_results_specific.json');
            fs.writeFileSync(backupPath, JSON.stringify(allResults, null, 2));
            console.log(`Saved ${allResults.length} results to ${backupPath}`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

fetchResultsById();
