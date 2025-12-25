import { auth } from "@/lib/firebaseClient"
import { signOut } from "firebase/auth"

export const logout = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth)
    
    // Clear any stored data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      sessionStorage.clear() // Clear all session data

      // Clear cookies (best-effort)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    }
    
    return true
  } catch (error) {
    console.error("Logout error:", error)
    return false
  }
}