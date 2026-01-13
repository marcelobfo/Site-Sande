
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://nzkdhuqlvwemqbkhjhav.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56a2RodXFsdndlbXFia2hqaGF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIzMzUxMiwiZXhwIjoyMDgzODA5NTEyfQ.oj01Krz1r-PynQ5DqQZWSrECar7CmPLl5DU2GnY-9Tw';

export const supabase = createClient(supabaseUrl, supabaseKey);
