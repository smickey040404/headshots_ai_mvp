"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { refreshSessionIfNeeded } from "@/lib/supabaseConfig";

/**
 * Global session manager component that handles authentication
 * across the entire application
 */
export default function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip session check on auth-related pages
    if (pathname?.startsWith("/auth/") || pathname === "/login") {
      return;
    }

    const checkAndRefreshSession = async () => {
      try {
        // Check for an existing session and refresh it if needed
        const { data, error } = await refreshSessionIfNeeded();
        
        if (error) {
          console.error("Session error:", error);
        }
        
        // If user is on a protected route but has no session, redirect to login
        const isProtectedRoute = 
          pathname?.startsWith("/overview") || 
          pathname?.startsWith("/get-credits");
        
        if (isProtectedRoute && !data?.session) {
          router.push("/login");
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };
    
    // Run the check
    checkAndRefreshSession();
  }, [pathname, router]);

  // This is a utility component that doesn't render anything visible
  return null;
} 