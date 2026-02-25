"use client";

import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { rescheduleBooking } from "./booking-actions";

interface SerializedTimeslot {
	dtstart: string;
	dtend: string;
	scheduleId: string;
	isAvailable: boolean;
	availableSpots: number;
}

interface RescheduleClientProps {
	bookingId: string;
	email: string;
	eventTitle: string;
	currentDtstart: string;
	currentDtend: string;
	timeslots: SerializedTimeslot[];
	eventsPath: string;
	bookingPath: string;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function formatTime(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}

function formatLongDate(dateString: string): string {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(new Date(dateString));
}

export function RescheduleClient({
	bookingId,
	email,
	eventTitle,
	currentDtstart,
	currentDtend,
	timeslots,
	eventsPath: _eventsPath,
	bookingPath,
}: RescheduleClientProps) {
	const [selectedSlot, setSelectedSlot] = useState<SerializedTimeslot | null>(
		null,
	);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const timeslotsByDate = useMemo(() => {
		const map = new Map<string, SerializedTimeslot[]>();
		for (const slot of timeslots) {
			const dateKey = slot.dtstart.split("T")[0];
			if (!map.has(dateKey)) map.set(dateKey, []);
			map.get(dateKey)?.push(slot);
		}
		return map;
	}, [timeslots]);

	const availableDates = useMemo(
		() =>
			Array.from(timeslotsByDate.keys())
				.sort()
				.map((k) => new Date(k)),
		[timeslotsByDate],
	);

	const [selectedDate, setSelectedDate] = useState<Date | null>(
		availableDates[0] || null,
	);

	const selectedDateSlots = useMemo(() => {
		if (!selectedDate) return [];
		const key = selectedDate.toISOString().split("T")[0];
		return timeslotsByDate.get(key) || [];
	}, [selectedDate, timeslotsByDate]);

	const isCurrentSlot = (slot: SerializedTimeslot) =>
		slot.dtstart === currentDtstart && slot.dtend === currentDtend;

	async function handleReschedule() {
		if (!selectedSlot) return;
		setIsPending(true);
		setError(null);

		const result = await rescheduleBooking(
			bookingId,
			email,
			selectedSlot.dtstart,
			selectedSlot.dtend,
			selectedSlot.scheduleId,
		);

		if (result.success) {
			setSuccess(true);
		} else {
			setError(result.error || "Failed to reschedule");
		}
		setIsPending(false);
	}

	if (success) {
		return (
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-12 max-w-2xl text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
						<CheckCircle2Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
					</div>
					<h1 className="text-2xl font-semibold mb-2">Booking Rescheduled</h1>
					<p className="text-muted-foreground mb-8">
						Your booking for {eventTitle} has been moved to a new time.
					</p>
					<Button asChild>
						<Link href={bookingPath}>View Updated Booking</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link
						href={bookingPath}
						className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon className="h-4 w-4" />
						<span>Back to booking</span>
					</Link>
				</div>
			</div>

			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<h1 className="text-2xl font-semibold mb-2">Reschedule Booking</h1>
				<p className="text-muted-foreground mb-8">{eventTitle}</p>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Current Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-2">
								<CalendarIcon className="h-4 w-4 text-muted-foreground" />
								<span>{formatLongDate(currentDtstart)}</span>
							</div>
							<div className="flex items-center gap-2">
								<ClockIcon className="h-4 w-4 text-muted-foreground" />
								<span>
									{formatTime(new Date(currentDtstart))} -{" "}
									{formatTime(new Date(currentDtend))}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Separator className="my-6" />

				<h2 className="text-lg font-medium mb-4">Select a new time</h2>

				{availableDates.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center">
							<p className="text-muted-foreground">
								No available timeslots found for this event.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{availableDates.slice(0, 7).map((date) => {
								const key = date.toISOString().split("T")[0];
								const isSelected =
									selectedDate?.toISOString().split("T")[0] === key;
								return (
									<Button
										key={key}
										type="button"
										variant={isSelected ? "default" : "outline"}
										size="sm"
										onClick={() => {
											setSelectedDate(date);
											setSelectedSlot(null);
										}}
									>
										{formatDate(date)}
									</Button>
								);
							})}
						</div>

						<div className="space-y-2">
							{selectedDateSlots.map((slot) => {
								const start = new Date(slot.dtstart);
								const end = new Date(slot.dtend);
								const isCurrent = isCurrentSlot(slot);
								const isSelected =
									selectedSlot?.dtstart === slot.dtstart &&
									selectedSlot?.dtend === slot.dtend;

								return (
									<button
										key={`${slot.dtstart}-${slot.scheduleId}`}
										type="button"
										disabled={!slot.isAvailable || isCurrent}
										onClick={() => setSelectedSlot(slot)}
										className={`w-full text-left p-3 rounded-lg border transition-colors ${
											isSelected
												? "border-primary bg-primary/5"
												: isCurrent
													? "border-border bg-muted/50 opacity-60"
													: slot.isAvailable
														? "border-border hover:border-primary/50"
														: "border-border opacity-40 cursor-not-allowed"
										}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<ClockIcon className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium text-sm">
													{formatTime(start)} - {formatTime(end)}
												</span>
												{isCurrent && (
													<Badge variant="outline" className="text-xs">
														Current
													</Badge>
												)}
											</div>
											{slot.isAvailable && !isCurrent ? (
												<span className="text-xs text-muted-foreground">
													{slot.availableSpots} spots
												</span>
											) : !slot.isAvailable ? (
												<span className="text-xs text-muted-foreground">
													Full
												</span>
											) : null}
										</div>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{error && (
					<div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}

				<div className="mt-6 flex gap-3">
					<Button
						className="flex-1"
						disabled={!selectedSlot || isPending}
						onClick={handleReschedule}
					>
						{isPending ? "Rescheduling..." : "Confirm New Time"}
					</Button>
				</div>
			</div>
		</div>
	);
}
