"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshSessionIfNeeded } from "@/lib/supabaseConfig";

/**
 * This component handles session initialization on the client-side
 * to prevent the need for manual refresh after login
 */
export default function SessionInitializer() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await refreshSessionIfNeeded();
        
        // If we have a valid session, refresh the page to update auth state
        if (data?.session) {
          // Use Next.js router to refresh the page
          router.refresh();
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    // Run once on mount
    checkSession();
  }, [router]);

  // This component doesn't render anything
  return null;
} 