const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sebjqfbteohfixnxotvw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYmpxZmJ0ZW9oZml4bnhvdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc2MzQsImV4cCI6MjA4NTYxMzYzNH0.dJD7r1uZKkXENsf8XnH7VqN2WQgQRpcE_5H_xe1PI9I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getProject() {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Project:', data);
    }
}

getProject();
