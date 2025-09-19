"use client";

import { useFormFields } from "@payloadcms/ui";
import type { UIFieldClientComponent } from "payload";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarProvider } from "@/components/calendar/calendar-provider";
import { CalendarEventTypes } from "@/components/calendar/types";
import usePayloadAPI from "@/hooks/use-payload-api";
import { expandSchedule } from "@/lib/expand-schedule";
import { getEventDuration } from "@/lib/get-event-duration";
import type { Event } from "@/payload-types";

const EventCalendars: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);
  const [{ data }] = usePayloadAPI<Event>(`/api/events/${selectedEvent.value}`);

  return (
    <div className="twp">
      <CalendarProvider
        loadEvents={(viewStart, viewEnd) => {
          const schedules = data?.schedules?.schedule;

          const events =
            schedules?.flatMap((schedule) => {
              if (!schedule.id) return [];

              if (!schedule.rrulestring) {
                return [
                  {
                    // Single instance schedule
                    type: CalendarEventTypes.scheduleInstance,
                    scheduleId: schedule.id,
                    dtstart: new Date(schedule.dtstart),
                    dtend: new Date(schedule.dtend),
                  },
                ];
              }

              const expanded = expandSchedule({
                rruleString: schedule.rrulestring,
                eventDuration: getEventDuration(
                  schedule.dtstart,
                  schedule.dtend
                ),
                scheduleId: schedule.id,
                eventName: data?.title,
                viewStart,
                viewEnd,
              });

              return expanded;
            }) || [];

          return events;
        }}
      >
        <Calendar />
      </CalendarProvider>
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
