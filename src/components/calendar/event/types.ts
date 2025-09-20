import type { CalendarEvent } from "../types";

export type EventCardPropsBase = {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  compact?: boolean;
  stickyTitle?: boolean;
  isSelected?: boolean;
};
