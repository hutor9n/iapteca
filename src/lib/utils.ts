import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Очікується", variant: "outline" },
  CONFIRMED: { label: "Підтверджено", variant: "secondary" },
  COMPLETED: { label: "Виконано", variant: "default" },
  CANCELLED: { label: "Скасовано", variant: "destructive" },
};
