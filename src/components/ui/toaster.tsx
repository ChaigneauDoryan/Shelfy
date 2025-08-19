"use client"

import React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { FaBook, FaBookReader, FaCalendarCheck, FaCompass, FaShoePrints, FaStar } from 'react-icons/fa';

const iconMap: { [key: string]: React.ElementType } = {
  FaShoePrints: FaShoePrints,
  FaBookReader: FaBookReader,
  FaBook: FaBook,
  FaCalendarCheck: FaCalendarCheck,
  FaCompass: FaCompass,
  FaStar: FaStar,
};

export function Toaster() {
  const { toasts } = useToast()

  return (
        <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, icon, ...props }) {
        const IconComponent = icon ? iconMap[icon] : null;
        return (
          <Toast key={id} {...props} duration={duration}>
            {IconComponent && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 mr-3">
                {React.createElement(IconComponent, { className: 'h-5 w-5 text-gray-600' })}
              </div>
            )}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
