import { Temporal } from "temporal-polyfill";
import type { UTCDateString } from "@/types/alias";

export const getEventDuration = (
  dtstart: UTCDateString,
  dtend: UTCDateString
) => {
  const startInstant = Temporal.Instant.from(dtstart);
  const endInstant = Temporal.Instant.from(dtend);

  return startInstant.until(endInstant);
};
