"use client";

import { useField } from "@payloadcms/ui";
import type { UIFieldClientComponent } from "payload";
import { useEffect, useState } from "react";
import type { EventPricesRecordType } from "@/collections/Events/utils/schemas";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarProvider } from "@/components/calendar/calendar-provider";
import {
  CalendarEventTypes,
  type ScheduleInstance,
} from "@/components/calendar/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { expandSchedule } from "@/lib/expand-schedule";
import { getEventDuration } from "@/lib/get-event-duration";
import { cn } from "@/lib/utils";
import { useEventData } from "./use-event-data";

const EventsCalendars: UIFieldClientComponent = (_props) => {
  const fieldDtstart = useField<Date>({ path: "dtstart" });
  const fieldDtend = useField<Date>({ path: "dtend" });

  const fieldPricingSnapshot = useField<EventPricesRecordType>({
    path: "pricingSnapshot",
  });
  const scheduleInstanceData = useField<ScheduleInstance>({
    path: "selectedScheduleInstanceData",
  });

  const { data: eventData, isPaid: isDisabled } = useEventData();

  const schedules = eventData?.schedules?.schedule;
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
              maxQuantity: eventData?.maxQuantity || 0,
            },
          ];
        }

        const expandedSchedule = expandSchedule({
          rruleString: schedule.rrulestring,
          eventMaxQuantity: eventData?.maxQuantity || 0,
          eventDuration: getEventDuration(schedule.dtstart, schedule.dtend),
          scheduleId: schedule.id,
          eventName: eventData?.title,
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
                    disabled={isDisabled || !schedule.isActive}
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
