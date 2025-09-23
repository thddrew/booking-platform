import type { CollectionBeforeValidateHook } from "payload";
import { CalendarEventSchema } from "@/components/calendar/schemas";
import type { Booking } from "@/payload-types";
import { isDate } from "../../../components/calendar/utils/is-date";

export const setDatetimes: CollectionBeforeValidateHook<Booking> = async ({
  data,
}) => {
  if (!data) return data;

  console.log(
    "data.selectedScheduleInstanceData",
    data.selectedScheduleInstanceData
  );

  // This hook receives the dates as strings
  try {
    const selectedTime = CalendarEventSchema.parse(
      data.selectedScheduleInstanceData
    );

    data.dtstart = isDate(selectedTime.dtstart)
      ? selectedTime.dtstart.toISOString()
      : selectedTime.dtstart;
    data.dtend = isDate(selectedTime.dtend)
      ? selectedTime.dtend.toISOString()
      : selectedTime.dtend;
  } catch (err) {
    console.error(err);
  }

  return data;
};
