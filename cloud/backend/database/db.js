const { createClient } = require('@supabase/supabase-js');

// These should be set in Render's Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;