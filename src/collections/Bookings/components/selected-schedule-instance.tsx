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

const SelectedScheduleInstance: UIFieldClientComponent = (props) => {
  const field = useField<CalendarEvent>();
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);

  if (!selectedEvent.value) {
    return (
      <Card className="w-full">
        <CardContent>
          <p>Select an event from the dropdown to view the available slots.</p>
        </CardContent>
      </Card>
    );
  }

  if (!field.value) {
    return (
      <Card className="w-full">
        <CardContent>
          <p>Select an available time slot from the calendar</p>
        </CardContent>
      </Card>
    );
  }

  const instance = CalendarEventSchema.parse(field.value);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookPlusIcon className="size-6 stroke-[1.5px]" /> Booking for{" "}
          {formatDateRange(instance.dtstart, instance.dtend)}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default SelectedScheduleInstance;
