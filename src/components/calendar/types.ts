import type React from "react";
import { Schedule } from "@/collections/Events/hooks/generateRrulestring";
import { Booking } from "@/payload-types";
import type { MonthViewConfig } from "./month-view";

export interface AttendeeType {
  type: "adult" | "student" | "senior" | "child";
  count: number;
  price: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentDetails {
  method: "card" | "cash" | "bank_transfer" | "paypal";
  status: "paid" | "pending" | "failed" | "refunded";
  amount: number;
  transactionId?: string;
}

export interface SurfingBooking {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  category?: string;
  customer: CustomerDetails;
  lessonType: "beginner" | "intermediate" | "advanced" | "private" | "group";
  attendees: AttendeeType[];
  payment: PaymentDetails;
  instructor?: string;
  equipment?: string[];
  notes?: string;
  // For recurring events
  rrulestring?: string;
  dtstart?: Date;
  dtend?: Date;
}

export const CalendarEventTypes = {
  booking: "booking",
  scheduleInstance: "scheduleInstance",
  openTimeSlot: "openTimeSlot",
} as const;

type CalendarEventBase = {
  dtstart: Date;
  dtend: Date;
  title?: string;
};

// This is either a booked event or an open time slot
export type CalendarEvent = CalendarEventBase &
  (
    | {
        type: typeof CalendarEventTypes.booking;
        bookingId: string;
      }
    | {
        type: typeof CalendarEventTypes.scheduleInstance;
        scheduleId: string;
      }
    | {
        type: typeof CalendarEventTypes.openTimeSlot;
      }
  );

export type _CalendarEvent = SurfingBooking;

export type CalendarView = "month" | "week" | "three-day" | "day";

export interface CalendarProps {
  onViewChange?: (view: CalendarView) => void;
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onCreateBooking?: (date: Date) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  className?: string;
  eventRenderer?: (event: CalendarEvent) => React.ReactNode;
  config?: {
    month?: MonthViewConfig;
  };
}
