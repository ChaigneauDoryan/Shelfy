"use client"

import { ReactNode } from "react"
import { toast as sonnerToast } from "sonner"

type Toast = {
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "destructive"
  duration?: number
  icon?: ReactNode
}

const toast = ({ title, description, variant, ...props }: Toast) => {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      ...props,
    })
  } else {
    sonnerToast.success(title, {
      description,
      ...props,
    })
  }
}

const useToast = () => {
  return { toast }
}

export { useToast, toast }
