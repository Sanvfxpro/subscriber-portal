const { createClient } = require('@supabase/supabase-js');

// 2. Configuration for NEW Project
const NEW_PROJECT_URL = 'https://sebjqfbteohfixnxotvw.supabase.co';
const NEW_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYmpxZmJ0ZW9oZml4bnhvdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc2MzQsImV4cCI6MjA4NTYxMzYzNH0.dJD7r1uZKkXENsf8XnH7VqN2WQgQRpcE_5H_xe1PI9I';

const supabaseNew = createClient(NEW_PROJECT_URL, NEW_ANON_KEY);

async function verifyImport() {
    console.log('Verifying import for Project a2...');

    try {
        const { data, error } = await supabaseNew
            .from('sorting_results')
            .select('*')
            .eq('project_id', '1759926505165');

        if (error) {
            console.error('Error fetching results:', error);
        } else {
            console.log(`Found ${data.length} results for project a2.`);
            if (data.length === 9) {
                console.log("SUCCESS: All 9 results are present.");
            } else {
                console.log(`WARNING: Expected 9 results, but found ${data.length}.`);
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

verifyImport();
