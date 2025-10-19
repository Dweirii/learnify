"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Laptop } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const cycle = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Toggle theme (current: ${theme})`}
      onClick={cycle}
      className="h-9 w-9"
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
