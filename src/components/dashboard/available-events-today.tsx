"use client";

import type { Temporal } from "@js-temporal/polyfill";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatDate } from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";
import { RRuleTemporal } from "rrule-temporal";
import type { Event } from "@/payload-types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { getTodayInUTC } from "./utils/get-today";
import { useAvailableEventsToday } from "./utils/use-available-events-today";

export const AvailableEventsToday = () => {
	const [selectedEventId, setSelectedEventId] = useState<string>("all");
	const parentRef = useRef<HTMLDivElement | null>(null);
	const today = new Date();
	const { data } = useAvailableEventsToday(today);
	const { startOfDay, endOfDay } = getTodayInUTC(today);

	const generateTimeslotsFromEvent = useCallback(
		(event: Event) => {
			try {
				const schedules = event.schedules?.schedule?.map((schedule) => {
					return {
						eventId: event.id,
						eventTitle: event.title,
						scheduleId: schedule.id,
						rrulestring: schedule.rrulestring,
					};
				});

				if (!schedules) return [];

				const allSlots: Temporal.ZonedDateTime[] = [];
				for (const schedule of schedules) {
					if (!schedule?.rrulestring) continue;

					const rrule = new RRuleTemporal({
						rruleString: schedule.rrulestring,
						tzid: "UTC",
					});
					const occurrences = rrule.between(startOfDay, endOfDay, true);
					allSlots.push(...occurrences);
				}

				return allSlots;
			} catch (err) {
				console.error(err);
				return [];
			}
		},
		[startOfDay, endOfDay],
	);

	const timeslots = useMemo(() => {
		if (selectedEventId === "all") {
			const allScheduleSlots = data?.docs?.flatMap((event) => {
				return generateTimeslotsFromEvent(event as Event);
			});

			return allScheduleSlots;
		}

		const filteredEvent = data?.docs?.find(
			(event) => event.id === selectedEventId,
		);
		if (!filteredEvent) return [];

		const filteredEventSlots = generateTimeslotsFromEvent(
			filteredEvent as Event,
		);

		return filteredEventSlots;
	}, [data?.docs, selectedEventId, generateTimeslotsFromEvent]);

	const rowVirtualizer = useVirtualizer({
		count: timeslots?.length ?? 0,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 35,
	});

	const rows = rowVirtualizer.getVirtualItems();

	return (
		<div className="twp w-full">
			<h3 className="font-bold text-xl mb-4">Available events today</h3>
			<div>
				<Select value={selectedEventId} onValueChange={setSelectedEventId}>
					<SelectTrigger size="sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						{data?.docs?.map((event) => {
							return (
								<SelectItem key={event.id} value={event.id}>
									{event.title}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			<div
				ref={parentRef}
				className="relative h-[500px] max-h-screen overflow-y-auto"
			>
				{rows?.map((row) => {
					const date = formatDate(
						new Date(timeslots?.[row.index]?.epochMilliseconds ?? 0),
						"h:mm a",
					);

					return (
						<div
							key={timeslots?.[row.index]?.epochMilliseconds}
							style={{
								position: "absolute",
								transform: `translateY(${row.start}px)`,
								height: `${row.size}px`,
							}}
						>
							{date}
						</div>
					);
				})}
			</div>
		</div>
	);
};
