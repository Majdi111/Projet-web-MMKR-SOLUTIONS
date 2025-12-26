"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Theme provider wrapper
// Enables dark/light mode switching across the application

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
