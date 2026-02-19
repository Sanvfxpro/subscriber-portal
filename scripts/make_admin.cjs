const { createClient } = require('@supabase/supabase-js');

// Config from .env (read manually to avoid dotenv dependency issues in simple script)
const SUPABASE_URL = 'https://sebjqfbteohfixnxotvw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYmpxZmJ0ZW9oZml4bnhvdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc2MzQsImV4cCI6MjA4NTYxMzYzNH0.dJD7r1uZKkXENsf8XnH7VqN2WQgQRpcE_5H_xe1PI9I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function makeAdmin(email) {
    console.log(`Looking for user with email: ${email}`);

    // Fetch all profiles since we can't filter by email if RLS restricts it or if email is not indexed/exposed
    // But let's try to filter first
    const { data: profiles, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*');

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError.message);
        return;
    }

    const user = profiles.find(p => p.email === email);

    if (!user) {
        console.error('User not found in user_profiles table.');
        console.log('Available emails:', profiles.map(p => p.email).join(', '));
        return;
    }

    console.log(`Found user: ${user.id} (Current Role: ${user.role})`);

    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating profile:', updateError.message);
        console.log('You might need to run the SQL manually due to permission restrictions.');
    } else {
        console.log('Successfully updated user to admin!');
    }
}

makeAdmin('vismayak@gmail.com');
