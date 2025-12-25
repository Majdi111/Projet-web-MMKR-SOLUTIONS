import type { Transition } from "framer-motion"

export const hoverTransition: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 26,
  mass: 0.8,
}

export const tapTransition: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.7,
}

// Shared hover/tap poses
export const hoverCard = { scale: 1.02, y: -4 }
export const tapPress = { scale: 0.98 }

export const hoverIcon = { scale: 1.08 }

export const hoverNavItem = { scale: 1.02, x: 4 }
export const tapNavItem = { scale: 0.98 }
