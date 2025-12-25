"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"
import ForgotPasswordForm from "./ForgotPasswordForm"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"


export default function LoginPage() {
  const [formType, setFormType] = useState<"login" | "register" | "forgot">("login")
  const [direction, setDirection] = useState(0)
  const authState = useAuth()
  const router = useRouter()

  const handleSwitch = (type: "login" | "register" | "forgot") => {
    setDirection(type === "login" ? -1 : 1)
    setFormType(type)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010513] via-[#061030] to-[#020617] p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden"
      >
        {/* Left panel */}
        <div className="w-1/2 relative px-10 py-12 bg-gradient-to-br from-[#081534] via-[#0d1b47] to-[#050e27] text-white">
          <div className="absolute -right-24 -bottom-10 w-64 h-64 rounded-full bg-blue-900/30 blur-2xl" />
          <div className="absolute -left-16 top-6 w-52 h-52 rounded-full bg-indigo-700/40 blur-xl" />
          <h1 className="text-4xl font-bold tracking-wide text-blue-100">WELCOME</h1>
          <p className="mt-2 text-sm text-blue-200/80">MMKR SOLUTIONS</p>
          <p className="mt-6 text-sm text-blue-100/70 leading-relaxed">
            Empowering your business through smart digital solutions.
             Our platform combines innovation, performance, and seamless user experience to help you grow faster. 
          </p>
        </div>     
        

        

        {/* Right panel with animated form */}
        <div className="w-1/2 bg-gradient-to-b from-[#0e142d] via-[#0a0f26] to-[#05091b] p-10 text-white overflow-hidden relative">
          {authState?.user && (
            <Card className="mb-6 bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white">
                  You’re already signed in
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-white/70 mb-4">
                  Signed in as <span className="font-semibold">{authState.user.email ?? "User"}</span>
                </p>
                <div className="flex gap-3">
                  <Button
                    className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950"
                    onClick={() => router.replace("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 transition-all duration-300 ease-out"
                    onClick={async () => {
                      await logout()
                      window.location.replace("/")
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <AnimatePresence custom={direction} mode="wait">
            {formType === "login" && (
              <motion.div
                key="login"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <LoginForm onSwitch={handleSwitch} />
              </motion.div>
            )}

            {formType === "register" && (
              <motion.div
                key="register"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <RegisterForm onSwitch={handleSwitch} />
              </motion.div>
            )}

            {formType === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <ForgotPasswordForm onSwitch={handleSwitch} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
