const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sebjqfbteohfixnxotvw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYmpxZmJ0ZW9oZml4bnhvdHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc2MzQsImV4cCI6MjA4NTYxMzYzNH0.dJD7r1uZKkXENsf8XnH7VqN2WQgQRpcE_5H_xe1PI9I';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addTestCard() {
    // 1. Get the first project
    const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

    if (projError || !projects || projects.length === 0) {
        console.error('Error fetching project:', projError);
        return;
    }

    const project = projects[0];
    console.log('Target Project:', project.name, project.id);

    // 2. Create a new card with description
    const newCard = {
        id: 'test-card-' + Date.now(),
        content: 'Test Card with Description',
        description: 'This is a detailed tooltip description for verification.',
        sortOrder: project.cards.length
    };

    const updatedCards = [...project.cards, newCard];

    // 3. Update the project
    const { error: updateError } = await supabase
        .from('projects')
        .update({ cards: updatedCards })
        .eq('id', project.id);

    if (updateError) {
        console.error('Error updating project:', updateError);
    } else {
        console.log('Successfully added test card to project:', project.id);
        console.log('Card Content:', newCard.content);
        console.log('Card Description:', newCard.description);
    }
}

addTestCard();
