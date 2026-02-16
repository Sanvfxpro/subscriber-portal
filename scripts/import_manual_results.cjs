const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 2. Configuration for NEW Project
const NEW_PROJECT_URL = 'https://sebjqfbteohfixnxotvw.supabase.co';
const NEW_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYmpxZmJ0ZW9oZml4bnhvdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc2MzQsImV4cCI6MjA4NTYxMzYzNH0.dJD7r1uZKkXENsf8XnH7VqN2WQgQRpcE_5H_xe1PI9I';

const supabaseNew = createClient(NEW_PROJECT_URL, NEW_ANON_KEY);

async function importManualResults() {
    const dataPath = path.join(__dirname, 'manual_results_a2.json');
    console.log('Reading data from:', dataPath);

    try {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);

        // Convert project ID to string to match DB type if needed (DB text or bigint?)
        // In our restoredProjects.ts it was a string "1759926505165".
        // In the JSON it is number 1759926505165.
        const projectId = String(data.project.project_id);
        const results = data.results;

        console.log(`Found ${results.length} results for Project ID ${projectId} (${data.project.name})`);

        // Prepare rows for insertion
        const rowsToInsert = results.map(r => ({
            id: r.id, // Use the ID from the JSON
            project_id: projectId,
            participant_email: r.email,
            result_data: {
                email: r.email,
                categories: r.categories
            },
            created_at: r.createdAt,
            updated_at: r.createdAt // Use createdAt for updated_at as well
        }));

        // Batch insert
        const { data: inserted, error } = await supabaseNew
            .from('sorting_results')
            .upsert(rowsToInsert, { onConflict: 'id' }) // Upsert based on ID to avoid dupes
            .select();

        if (error) {
            console.error('Error importing results:', error);
        } else {
            console.log(`Successfully imported ${inserted.length} results.`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

importManualResults();
