"use client";

import { useFormFields } from "@payloadcms/ui";
import type { UIFieldClientComponent } from "payload";
import { Calendar } from "@/components/calendar/calendar";
import usePayloadAPI from "@/hooks/use-payload-api";
import type { Event } from "@/payload-types";

const EventCalendars: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);
  const [{ data, isLoading, isError }] = usePayloadAPI<Event>(
    `/api/events/${selectedEvent.value}`
  );
  console.log("selectedEvent", selectedEvent);
  console.log("data", data);
  console.log("isLoading", isLoading);
  console.log("isError", isError);

  return (
    <div className="twp">
      <Calendar />
    </div>
  );
};

const EventCalendarsWrapper: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);

  return (
    <div className="twp">
      {selectedEvent.value ? (
        <EventCalendars {...props} />
      ) : (
        <p className="text-muted-foreground">
          Select an event to view the available slots.
        </p>
      )}
    </div>
  );
};

export default EventCalendarsWrapper;
