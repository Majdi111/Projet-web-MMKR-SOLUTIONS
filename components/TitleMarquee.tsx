"use client"

import { useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"

function titleFromPathname(pathname: string): string {
  if (pathname === "/") return "Home"

  const segment = pathname.split("/").filter(Boolean)[0] ?? "Home"
  if (segment.toLowerCase() === "signin") return "Sign In"

  return segment
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

export default function TitleMarquee() {
  const pathname = usePathname()
  const titleText = useMemo(() => {
    return titleFromPathname(pathname)
  }, [pathname])

  useEffect(() => {
    document.title = titleText
  }, [titleText])

  return null
}
