import type { CalendarEvent } from "../schemas";

export type EventCardPropsBase = {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  compact?: boolean;
  stickyTitle?: boolean;
  isSelected?: boolean;
};
