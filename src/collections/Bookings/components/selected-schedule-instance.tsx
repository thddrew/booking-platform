"use client";

import { useField } from "@payloadcms/ui";
import { BookPlusIcon } from "lucide-react";
import type { UIFieldClientComponent } from "payload";
import {
	CalendarEventSchema,
	type ScheduleInstance,
} from "@/components/calendar/schemas";
import { formatDateRange } from "@/components/calendar/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SelectedScheduleInstance: UIFieldClientComponent = (_props) => {
	const field = useField<ScheduleInstance>();

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
					{formatDateRange(
						new Date(instance.dtstart),
						new Date(instance.dtend),
					)}
				</CardTitle>
			</CardHeader>
		</Card>
	);
};

export default SelectedScheduleInstance;
