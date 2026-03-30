import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dyotbojxtcqhcmrefofb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5b3Rib2p4dGNxaGNtcmVmb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU2NTIsImV4cCI6MjA5MDI5MTY1Mn0.dJp5-vqXoW_9s-Br2vyn8sx2fo2wDWpNWlr5tqgddqo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
