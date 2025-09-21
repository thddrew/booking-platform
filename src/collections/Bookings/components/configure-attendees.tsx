"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import { BookPlusIcon } from "lucide-react";
import type { UIFieldClientComponent } from "payload";
import {
  type CalendarEvent,
  CalendarEventSchema,
} from "@/components/calendar/schemas";
import { formatDateRange } from "@/components/calendar/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import usePayloadAPI from "@/hooks/use-payload-api";
import { Event } from "@/payload-types";

const ConfigureAttendees: UIFieldClientComponent = (props) => {
  const field = useField({ path: "pricingSnapshot" });
  const selectedInstanceField = useField<CalendarEvent>({
    path: "selectedScheduleInstanceData",
  });
  const selectedEventField = useField<number>({
    path: "eventRelation",
  });
  const [{ data }] = usePayloadAPI<Event>(
    `/api/events/${selectedEventField.value}`
  );

  console.log({ field, selectedEventField, selectedInstanceField });

  if (!selectedInstanceField.value) {
    return (
      <Card className="w-full">
        <CardContent>
          <p>
            Select an available time slot for an event from the calendar to view
            pricing tiers.
          </p>
        </CardContent>
      </Card>
    );
  }

  const eventPrices = data?.prices;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookPlusIcon className="size-6 stroke-[1.5px]" /> Booking for{" "}
          {formatDateRange(
            selectedInstanceField.value.dtstart,
            selectedInstanceField.value.dtend
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {eventPrices?.map((price) => (
          <div key={price.id}>
            <h3>{price.label}</h3>
            <p>{price.description}</p>
            <p>{price.amount}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const ConfigureAttendeesWrapper: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);

  return selectedEvent.value ? <ConfigureAttendees {...props} /> : null;
};

export default ConfigureAttendees;
