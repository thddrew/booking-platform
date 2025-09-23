import type { CollectionBeforeValidateHook } from "payload";
import { CalendarEventSchema } from "@/components/calendar/schemas";
import type { Booking } from "@/payload-types";
import { getDateString } from "../../../components/calendar/utils/is-date";

export const setDatetimes: CollectionBeforeValidateHook<Booking> = async ({
  data,
}) => {
  if (!data) return data;

  // This hook receives the dates as strings
  try {
    const selectedTime = CalendarEventSchema.parse(
      data.selectedScheduleInstanceData
    );

    data.dtstart = getDateString(selectedTime.dtstart);
    data.dtend = getDateString(selectedTime.dtend);
  } catch (err) {
    console.error(err);
  }

  return data;
};
