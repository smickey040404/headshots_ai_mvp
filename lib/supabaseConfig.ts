import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

/**
 * Creates a properly configured Supabase client for client components
 */
export function createSupabaseClient() {
  return createClientComponentClient<Database>();
}

/**
 * Helper function to check if the user's session is valid
 * and refresh the token if needed
 */
export async function refreshSessionIfNeeded() {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    // If there's an active session, try to refresh it
    if (data?.session) {
      await supabase.auth.refreshSession();
    }
    
    return { data, error };
  } catch (error) {
    console.error("Error refreshing session:", error);
    return { data: null, error };
  }
} 