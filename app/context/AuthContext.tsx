/**
 * AuthContext Module
 * 
 * Provides authentication context for the entire application.
 * Handles Firebase authentication state management and automatic redirects based on auth status.
 * 
 * Features:
 * - Firebase authentication state tracking
 * - Automatic redirect to dashboard on login
 * - Automatic redirect to login on logout
 * - Protected route management
 * - Single redirect prevention with ref-based tracking
 * 
 * @module context/AuthContext
 */

"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { auth } from "@/lib/firebaseClient"
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  type User,
} from "firebase/auth"
import { usePathname, useRouter } from "next/navigation"

/**
 * Authentication context object
 * @type {React.Context<{user: any | null, loading: boolean}>}
 */
type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider Component
 * 
 * Wraps the application to provide authentication context.
 * Monitors Firebase auth state and handles automatic redirects.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider wrapper with auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false) // Prevent multiple redirects

  const isAuthPage =
    pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/signin"

  useEffect(() => {
    let didCancel = false
    let unsubscribe: (() => void) | undefined

    ;(async () => {
      try {
        // Keep user signed in only for the current browser session.
        await setPersistence(auth, browserSessionPersistence)
      } catch {
        // Ignore persistence errors; Firebase will use default behavior.
      }

      if (didCancel) return

      unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        setUser(firebaseUser)
        setLoading(false)

        if (hasRedirected.current) return

        if (!firebaseUser && !isAuthPage) {
          // Not logged in: protect app pages.
          hasRedirected.current = true
          router.replace("/")
        }

        if (firebaseUser && isAuthPage) {
          // Logged in: prevent navigating back to auth pages unless the user logs out.
          hasRedirected.current = true
          router.replace("/dashboard")
        }
      })
    })()

    // Reset redirect flag when pathname changes
    hasRedirected.current = false

    return () => {
      didCancel = true
      unsubscribe?.()
    }
  }, [router, pathname, isAuthPage])

  // Handle browser back/forward cache (bfcache) showing stale authenticated UI after logout.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (isAuthPage) return
      if (!event.persisted) return

      // If this page was restored from bfcache and the user is not signed in, force redirect.
      if (!auth.currentUser) {
        window.location.replace("/")
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [isAuthPage])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && (user && isAuthPage ? false : isAuthPage || user) ? children : null}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Returns current user and loading state throughout the application.
 * 
 * @hook
 * @returns {{user: any | null, loading: boolean}} Authentication context object
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * const { user, loading } = useAuth()
 */
export const useAuth = () => useContext(AuthContext)