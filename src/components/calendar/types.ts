import type React from "react";
// This is either a booked event or an open time slot
import { z } from "zod";

export type ViewConfig = {
  /** @default true */
  showCreateBtn?: boolean;
};

export const defaultViewConfig: ViewConfig = {
  showCreateBtn: true,
};

export const CalendarEventTypes = {
  booking: "booking",
  scheduleInstance: "scheduleInstance",
  openTimeSlot: "openTimeSlot",
} as const;

const CalendarEventBaseSchema = z.object({
  /** @ignore not reliable, to be removed */
  id: z.string(),
  dtstart: z.date(),
  dtend: z.date(),
  title: z.string().optional(),
});

export type CalendarEventBase = z.infer<typeof CalendarEventBaseSchema>;

export type ScheduleInstance = CalendarEventBase & {
  type: typeof CalendarEventTypes.scheduleInstance;
  scheduleId: string;
  maxQuantity: number;
};

export type BookingInstance = CalendarEventBase & {
  type: typeof CalendarEventTypes.booking;
  bookingId: string;
};

export type OpenTimeSlot = CalendarEventBase & {
  type: typeof CalendarEventTypes.openTimeSlot;
};

export const CalendarEventSchema = z.discriminatedUnion("type", [
  z.object({
    ...CalendarEventBaseSchema.shape,
    type: z.literal("booking"),
    bookingId: z.string(),
  }),
  z.object({
    ...CalendarEventBaseSchema.shape,
    type: z.literal("scheduleInstance"),
    scheduleId: z.string(),
    maxQuantity: z.number(),
  }),
  z.object({
    ...CalendarEventBaseSchema.shape,
    type: z.literal("openTimeSlot"),
  }),
]);

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export type CalendarView = "month" | "week" | "three-day" | "day";
