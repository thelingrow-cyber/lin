import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ireppvpjhtapnekmucam.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZXBwdnBqaHRhcG5la211Y2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDU2MDYsImV4cCI6MjA4OTg4MTYwNn0.65-_1V7CkU70CXVeLdETvoCkDXrOt3KIeKiEFUYAUuM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
