"use client";

import { ClockIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AvailableTimeslot } from "./utils/get-available-timeslots";

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

interface EventBookingPanelProps {
	timeslots: AvailableTimeslot[];
	minPrice: number;
	isFree: boolean;
	activePrices: Array<{ id?: string | null; label: string; amount: number }>;
	hasMultiplePrices: boolean;
}

export function EventBookingPanel({
	timeslots,
	minPrice,
	isFree,
	activePrices,
	hasMultiplePrices,
}: EventBookingPanelProps) {
	const timeslotsByDate = useMemo(() => {
		const map = new Map<string, AvailableTimeslot[]>();
		for (const slot of timeslots) {
			const dateKey = slot.dtstart.toISOString().split("T")[0];
			if (!map.has(dateKey)) {
				map.set(dateKey, []);
			}
			map.get(dateKey)?.push(slot);
		}
		return map;
	}, [timeslots]);

	const availableDates = useMemo(() => {
		return Array.from(timeslotsByDate.keys())
			.sort()
			.map((dateKey) => new Date(dateKey));
	}, [timeslotsByDate]);

	const [selectedDate, setSelectedDate] = useState<Date | null>(
		availableDates.length > 0 ? availableDates[0] : null,
	);

	const selectedDateTimeslots = useMemo(() => {
		if (!selectedDate) return [];
		const dateKey = selectedDate.toISOString().split("T")[0];
		return timeslotsByDate.get(dateKey) || [];
	}, [selectedDate, timeslotsByDate]);

	const [selectedTimeslot, setSelectedTimeslot] = useState<AvailableTimeslot | null>(null);

	return (
		<Card className="rounded-2xl shadow-lg">
			<CardContent className="p-6">
				<div className="flex items-baseline justify-between mb-6">
					<div>
						{!isFree ? (
							<>
								<span className="text-[22px] font-semibold">
									${minPrice.toFixed(0)}
								</span>
								{hasMultiplePrices && (
									<span className="text-[15px] text-muted-foreground ml-1">
										+
									</span>
								)}
							</>
						) : (
							<span className="text-[22px] font-semibold">Free</span>
						)}
					</div>
				</div>

			{availableDates.length > 0 ? (
				<div className="space-y-4 mb-6">
					<div>
						<div className="text-xs font-medium text-muted-foreground uppercase mb-2">
							Select Date
						</div>
						<div className="flex flex-wrap gap-2">
							{availableDates.slice(0, 7).map((date) => {
								const dateKey = date.toISOString().split("T")[0];
								const isSelected = selectedDate?.toISOString().split("T")[0] === dateKey;
								const isToday = date.toDateString() === new Date().toDateString();

								return (
									<Button
										key={dateKey}
										type="button"
										variant={isSelected ? "default" : "outline"}
										size="sm"
										onClick={() => setSelectedDate(date)}
									>
										{isToday ? "Today" : formatDate(date)}
									</Button>
								);
							})}
						</div>
					</div>

					{selectedDateTimeslots.length > 0 && (
						<div>
							<div className="text-xs font-medium text-muted-foreground uppercase mb-2">
								Available Times
							</div>
							<div className="space-y-2 max-h-[300px] overflow-y-auto">
								{selectedDateTimeslots.map((slot) => {
									const slotKey = `${slot.dtstart.toISOString()}-${slot.scheduleId}`;
									const isSelected = selectedTimeslot?.dtstart.getTime() === slot.dtstart.getTime();

									return (
										<button
											key={slotKey}
											type="button"
											onClick={() => setSelectedTimeslot(slot)}
											disabled={!slot.isAvailable}
											className={`
												w-full text-left p-3 rounded-lg border transition-colors
												${isSelected
													? "border-primary bg-primary/5"
													: slot.isAvailable
														? "border-border hover:border-primary/50 hover:bg-muted/50"
														: "border-border bg-muted/30 opacity-60 cursor-not-allowed"
												}
											`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<ClockIcon className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium text-[15px]">
														{formatTime(slot.dtstart)} - {formatTime(slot.dtend)}
													</span>
												</div>
												{slot.isAvailable ? (
													<span className="text-xs text-muted-foreground">
														{slot.availableSpots} {slot.availableSpots === 1 ? "spot" : "spots"}
													</span>
												) : (
													<span className="text-xs text-muted-foreground">Fully booked</span>
												)}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="mb-6">
					<Card>
						<CardContent className="p-4 text-center">
							<p className="text-sm text-muted-foreground">
								No available times at this time
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Button
				size="lg"
				className="w-full rounded-lg"
				disabled={!selectedTimeslot || !selectedTimeslot.isAvailable}
			>
				Book Event
			</Button>

			<p className="text-center text-[13px] text-muted-foreground mt-4">
				You won't be charged yet
			</p>

			{hasMultiplePrices && activePrices.length > 1 && (
				<div className="mt-6 pt-6 space-y-3">
					<Separator />
					{activePrices.map((price) => (
						<div
							key={price.id}
							className="flex items-center justify-between text-[14px]"
						>
							<span className="text-muted-foreground">
								{price.label}
							</span>
							<span className="font-medium">
								{price.amount === 0 ? (
									<Badge variant="success">Free</Badge>
								) : (
									`$${price.amount.toFixed(2)}`
								)}
							</span>
						</div>
					))}
					<Separator />
					<div className="flex items-center justify-between text-[14px] font-semibold pt-3">
						<span>Total</span>
						<span>
							{isFree ? (
								<Badge variant="success">Free</Badge>
							) : (
								`$${minPrice.toFixed(2)}`
							)}
						</span>
					</div>
				</div>
			)}
			</CardContent>
		</Card>
	);
}
