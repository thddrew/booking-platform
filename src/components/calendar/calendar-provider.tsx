"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CalendarEvent,
  CalendarView,
} from "@/components/calendar/schemas";

interface CalendarContextValue {
  currentDate: Date;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  navigateDate: (direction: "prev" | "next") => void;
  goToToday: () => void;
  viewDates: Date[];
  events: CalendarEvent[];
  selectedEvent?: CalendarEvent;
  setEvents: (events: CalendarEvent[]) => void;
  loading: boolean;
  getScrollToPosition?: (hourHeight: number) => number;
}

const CalendarContext = createContext<CalendarContextValue | undefined>(
  undefined
);

interface CalendarProviderProps {
  children: ReactNode;
  initialDate?: Date;
  initialView?: CalendarView;
  initialEvents?: CalendarEvent[];
  selectedEvent?: CalendarEvent;
  /**
   * A function to load events for a given date range.
   */
  loadEvents?: (
    viewStart: Date,
    viewEnd: Date,
    currentDate: Date
  ) => Promise<CalendarEvent[]> | CalendarEvent[];
}

export function CalendarProvider({
  children,
  selectedEvent,
  initialEvents,
  initialDate = new Date(),
  initialView = "three-day",
  loadEvents,
}: CalendarProviderProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState<boolean>(!!loadEvents);

  // Initialize calendar based on selectedEvent if provided
  useEffect(() => {
    if (selectedEvent) {
      try {
        const eventDate = new Date(selectedEvent.dtstart);
        if (!isNaN(eventDate.getTime())) {
          setCurrentDate(eventDate);
          // Use initialView if provided, otherwise keep current view (three-day default)
          if (initialView) {
            setView(initialView);
          }
        }
      } catch (error) {
        // Fallback to initialDate if event date is invalid
        console.warn(
          "Invalid selectedEvent.dtstart, falling back to initialDate:",
          error
        );
      }
    }
  }, []); // Run once on mount

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
        case "three-day":
          newDate.setDate(prev.getDate() + (direction === "next" ? 3 : -3));
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

  const getScrollToPosition = (hourHeight: number) => {
    // If selectedEvent is provided, scroll to its time
    if (selectedEvent) {
      try {
        const eventStart = new Date(selectedEvent.dtstart);
        const eventHour = eventStart.getHours();
        const eventMinute = eventStart.getMinutes();
        return Math.max(
          0,
          (eventHour - 2) * hourHeight + (eventMinute / 60) * hourHeight
        );
      } catch (error) {
        // Fallback to current time if event parsing fails
        console.warn(
          "Failed to parse selectedEvent time for scrolling:",
          error
        );
      }
    }

    // Default: scroll to current time
    const currentHour = new Date().getHours();
    return Math.max(0, (currentHour - 2) * hourHeight);
  };

  const viewDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);

    // Helper function to generate date range
    const generateDates = (startDate: Date, count: number): Date[] => {
      const dates: Date[] = [];
      const current = new Date(startDate);

      for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return dates;
    };

    let dates: Date[] = [];

    switch (view) {
      case "month": {
        const monthStart = new Date(start);
        monthStart.setDate(1);

        const firstDayOfWeek = monthStart.getDay();
        monthStart.setDate(monthStart.getDate() - firstDayOfWeek);

        dates = generateDates(monthStart, 42);
        break;
      }

      case "week": {
        const weekStart = new Date(start);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);

        dates = generateDates(weekStart, 7);
        break;
      }

      case "three-day": {
        dates = generateDates(start, 3);
        break;
      }

      case "day": {
        // Generate start of day and end of day
        const startOfDay = new Date(start);
        const endOfDay = new Date(start);
        endOfDay.setHours(23, 59, 59, 999);

        dates = [startOfDay, endOfDay];
        break;
      }
    }

    // Set the last date to end of day for views that need it
    if (dates.length > 0 && view !== "day") {
      dates[dates.length - 1].setHours(23, 59, 59, 999);
    }

    return dates;
  }, [currentDate, view]);

  useEffect(() => {
    if (loadEvents) {
      if (!viewDates.length) return;

      const viewStart = viewDates[0];
      const viewEnd = viewDates[viewDates.length - 1];

      setLoading(true);
      new Promise<CalendarEvent[]>((resolve) =>
        resolve(loadEvents(viewStart, viewEnd, currentDate))
      ).then((events) => {
        setEvents(events);
        setLoading(false);
      });
    }
  }, [viewDates, currentDate, loadEvents]);

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        events,
        getScrollToPosition,
        goToToday,
        loading,
        navigateDate,
        selectedEvent,
        setCurrentDate,
        setEvents,
        setView,
        view,
        viewDates,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }
  return context;
}
