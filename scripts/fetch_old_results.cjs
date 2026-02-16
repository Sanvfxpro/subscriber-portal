const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Configuration for OLD Project
const OLD_PROJECT_URL = 'https://bkvkhsiutpnhownwoskh.supabase.co';
const OLD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdmtoc2l1dHBuaG93bndvc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MTg5OTQsImV4cCI6MjA3NTM5NDk5NH0.EFx_FQmyo6Vk4iV32N0__yQFQpCuFZXj7gIX1OZD_WM';

const supabaseOld = createClient(OLD_PROJECT_URL, OLD_ANON_KEY);

async function fetchOldResults() {
    console.log('Attempting to connect to OLD database for RESULTS...');

    try {
        const { data: results, error } = await supabaseOld
            .from('sorting_results')
            .select('*');

        if (error) {
            console.error('Error fetching results from OLD DB:', error.message);
            return;
        }

        console.log(`Successfully found ${results.length} results in the old database.`);

        if (results.length > 0) {
            const backupPath = path.join(__dirname, 'old_results_backup.json');
            fs.writeFileSync(backupPath, JSON.stringify(results, null, 2));
            console.log(`Saved backup to ${backupPath}`);
        } else {
            console.log("Old database has no sorting results.");
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

fetchOldResults();
