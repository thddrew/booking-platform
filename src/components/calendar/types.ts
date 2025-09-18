import type React from "react"

export interface AttendeeType {
  type: "adult" | "student" | "senior" | "child"
  count: number
  price: number
}

export interface CustomerDetails {
  name: string
  email: string
  phone: string
}

export interface PaymentDetails {
  method: "card" | "cash" | "bank_transfer" | "paypal"
  status: "paid" | "pending" | "failed" | "refunded"
  amount: number
  transactionId?: string
}

export interface SurfingBooking {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  allDay?: boolean
  color?: string
  category?: string
  customer: CustomerDetails
  lessonType: "beginner" | "intermediate" | "advanced" | "private" | "group"
  attendees: AttendeeType[]
  payment: PaymentDetails
  instructor?: string
  equipment?: string[]
  notes?: string
  // For recurring events
  rrulestring?: string
  dtstart?: Date
  dtend?: Date
}

export type CalendarEvent = SurfingBooking

export type CalendarView = "month" | "week" | "day"

export interface CalendarProps {
  events?: CalendarEvent[]
  view?: CalendarView
  date?: Date
  onViewChange?: (view: CalendarView) => void
  onDateChange?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onEventCreate?: (event: Partial<CalendarEvent>) => void
  onEventUpdate?: (event: CalendarEvent) => void
  onEventDelete?: (eventId: string) => void
  className?: string
  eventColors?: Record<string, string>
  customEventRenderer?: (event: CalendarEvent) => React.ReactNode
}
