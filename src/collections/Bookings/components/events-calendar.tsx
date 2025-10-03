"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import type { FieldState, UIFieldClientComponent } from "payload";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarProvider } from "@/components/calendar/calendar-provider";
import {
  type CalendarEvent,
  CalendarEventTypes,
  ScheduleInstance,
} from "@/components/calendar/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { usePayloadQuery } from "@/hooks/use-payload-query";
import { expandSchedule } from "@/lib/expand-schedule";
import { getEventDuration } from "@/lib/get-event-duration";
import { cn } from "@/lib/utils";
import type { Booking, Event } from "@/payload-types";
import { payloadSDK } from "@/hooks/payload-sdk";
import { extractID } from "@/utilities/extractID";

type FieldStateWithValue<T> = FieldState & {
  value: T;
};

const EventsCalendars: UIFieldClientComponent = (props) => {
  const isDisabled = props.field.admin.disableBulkEdit;

  const selectedEvent = useFormFields(
    ([fields]) =>
      fields.eventRelation as FieldStateWithValue<Booking["eventRelation"]>
  );
  const fieldDtstart = useField<Date>({ path: "dtstart" });
  const fieldDtend = useField<Date>({ path: "dtend" });
  const fieldPricingSnapshot = useField({
    path: "pricingSnapshot",
  });
  const scheduleInstanceData = useField<ScheduleInstance>({
    path: "selectedScheduleInstanceData",
  });

  const { data } = usePayloadQuery({
    queryKey: ["events", selectedEvent.value],
    queryFn: async () => {
      const data = await payloadSDK.findByID({
        collection: "events",
        id: selectedEvent.value ? extractID(selectedEvent.value) : "",
      });

      return data;
    },
    options: {
      enabled: !!selectedEvent.value,
    },
  });

  const schedules = data?.schedules?.schedule;
  const [selectedSchedules, setSelectedSchedules] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (schedules) {
      setSelectedSchedules(
        schedules.reduce<Record<string, boolean>>((acc, schedule) => {
          if (!schedule.id) return acc;

          acc[schedule.id] = schedule.isActive ?? true;
          return acc;
        }, {})
      );
    }
  }, [schedules]);

  const loadEvents = async (viewStart: Date, viewEnd: Date) => {
    const schedulesToLoad =
      schedules?.filter(({ id }) => id && selectedSchedules[id]) || [];

    const eventsInView =
      schedulesToLoad.flatMap((schedule) => {
        if (!schedule.id) return [];

        if (!schedule.rrulestring) {
          return [
            {
              id: "", // createId(),
              // Single instance schedule
              type: CalendarEventTypes.scheduleInstance,
              scheduleId: schedule.id,
              dtstart: schedule.dtstart,
              dtend: schedule.dtend,
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
            includePastDates: true,
            generateId: () => "",
          },
        });

        return expandedSchedule;
      }) || [];

    return eventsInView;
  };

  return (
    <div className="twp @container">
      <div className="grid grid-cols-1 @4xl:grid-cols-[minmax(180px,min-content)_auto] gap-2">
        <Card className="flex flex-col gap-2">
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules?.map((schedule) => {
              if (!schedule.id) return null;
              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-3"
                >
                  <Checkbox
                    checked={selectedSchedules[schedule.id]}
                    disabled={!schedule.isActive}
                    onCheckedChange={(checked) => {
                      setSelectedSchedules({
                        ...selectedSchedules,
                        [schedule.id as string]: !!checked,
                      });
                      if (
                        scheduleInstanceData.value?.scheduleId === schedule.id
                      ) {
                        // Improve UX by clearing the selected schedule instance and pricing snapshot if its schedule is unchecked
                        fieldPricingSnapshot.setValue({});
                        scheduleInstanceData.setValue(null);
                      }
                    }}
                  />{" "}
                  <span
                    className={cn(
                      schedule.isActive ? "" : "text-muted-foreground"
                    )}
                  >
                    {schedule.scheduleName}{" "}
                    {schedule.isActive ? "" : "(Inactive)"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <CalendarProvider
          selectedEvent={scheduleInstanceData.value}
          loadEvents={loadEvents}
          initialView="month"
        >
          <Calendar
            onEventClick={(calEvent) => {
              if (isDisabled) return;

              scheduleInstanceData.setValue(calEvent);
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
    </div>
  );
};

export default EventsCalendars;
