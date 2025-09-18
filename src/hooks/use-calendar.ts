"use client";

import { useMemo, useState } from "react";
import type {
  CalendarEvent,
  CalendarView,
} from "@/components/calendar/calendar";

export function useCalendar(
  initialDate = new Date(),
  initialView: CalendarView = "month"
) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case "month":
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
          break;
        case "week":
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
          break;
        case "day":
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getViewDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate);

    switch (view) {
      case "month":
        start.setDate(1);
        const firstDayOfWeek = start.getDay();
        start.setDate(start.getDate() - firstDayOfWeek);

        for (let i = 0; i < 42; i++) {
          dates.push(new Date(start));
          start.setDate(start.getDate() + 1);
        }
        break;

      case "week":
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);

        for (let i = 0; i < 7; i++) {
          dates.push(new Date(start));
          start.setDate(start.getDate() + 1);
        }
        break;

      case "day":
        dates.push(new Date(start));
        break;
    }

    return dates;
  }, [currentDate, view]);

  const getEventsForDate = (date: Date, events: CalendarEvent[]) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const targetDate = new Date(date);

      targetDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);

      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  };

  return {
    currentDate,
    view,
    setView,
    setCurrentDate,
    navigateDate,
    goToToday,
    getViewDates,
    getEventsForDate,
  };
}
