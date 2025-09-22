"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import type { FieldState, UIFieldClientComponent } from "payload";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarProvider } from "@/components/calendar/calendar-provider";
import {
  type CalendarEvent,
  CalendarEventTypes,
} from "@/components/calendar/schemas";
import { usePayloadFetch } from "@/hooks/use-payload-fetch";
import { expandSchedule } from "@/lib/expand-schedule";
import { getEventDuration } from "@/lib/get-event-duration";
import type { Booking, Event } from "@/payload-types";

type FieldStateWithValue<T> = FieldState & {
  value: T;
};

const EventsCalendars: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(
    ([fields]) =>
      fields.eventRelation as FieldStateWithValue<Booking["eventRelation"]>
  );
  const fieldDtstart = useField({ path: "dtstart" });
  const fieldDtend = useField({ path: "dtend" });
  const fieldInstanceData = useField<CalendarEvent>({
    path: "selectedScheduleInstanceData",
  });

  const { data } = usePayloadFetch<Event>({
    api: `/api/events/${selectedEvent.value}`,
  });

  const loadEvents = async (viewStart: Date, viewEnd: Date) => {
    const schedules = data?.schedules?.schedule;

    const eventsInView =
      schedules?.flatMap((schedule) => {
        if (!schedule.id) return [];

        if (!schedule.rrulestring) {
          return [
            {
              id: "", // createId(),
              // Single instance schedule
              type: CalendarEventTypes.scheduleInstance,
              scheduleId: schedule.id,
              dtstart: new Date(schedule.dtstart),
              dtend: new Date(schedule.dtend),
              maxQuantity: data?.maxQuantity || 0,
            },
          ];
        }

        const expandedSchedule = expandSchedule({
          rruleString: schedule.rrulestring,
          eventMaxQuantity: data?.maxQuantity || 0,
          eventDuration: getEventDuration(schedule.dtstart, schedule.dtend),
          scheduleId: schedule.id,
          eventName: data?.title,
          viewStart,
          viewEnd,
          config: {
            generateId: () => "",
          },
        });

        return expandedSchedule;
      }) || [];

    return eventsInView;
  };

  return (
    <div className="twp">
      <CalendarProvider
        selectedEvent={fieldInstanceData.value}
        loadEvents={loadEvents}
      >
        <Calendar
          onEventClick={(calEvent) => {
            fieldInstanceData.setValue(calEvent);
            fieldDtstart.setValue(calEvent.dtstart);
            fieldDtend.setValue(calEvent.dtend);
          }}
          config={{
            month: {
              showCreateBtn: false,
            },
            week: {
              showCreateBtn: false,
            },
            "three-day": {
              showCreateBtn: false,
            },
            day: {
              showCreateBtn: false,
            },
          }}
        />
      </CalendarProvider>
    </div>
  );
};

const EventsCalendarsWrapper: UIFieldClientComponent = (props) => {
  const selectedEvent = useFormFields(([fields]) => fields.eventRelation);

  return selectedEvent.value ? <EventsCalendars {...props} /> : null;
};

export default EventsCalendarsWrapper;
