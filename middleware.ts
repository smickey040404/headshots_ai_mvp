import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'
import { Database } from './types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  
  try {
    // Try to refresh the session if it exists
    // This will force a refresh of the session cookie if it's expired
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error in middleware:', error.message)
    }
    
    // If we're on a protected route and there's no session, redirect to login
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/overview') ||
                             req.nextUrl.pathname.startsWith('/get-credits')
    
    if (isProtectedRoute && !session) {
      // Redirect to login if accessing protected route without session
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If we're on the login page and already have a session, redirect to the dashboard
    const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
    if (isAuthRoute && session) {
      // Redirect to overview if accessing login with an active session
      const redirectUrl = new URL('/overview', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (e) {
    console.error('Error in auth middleware:', e)
  }
  
  return res
}