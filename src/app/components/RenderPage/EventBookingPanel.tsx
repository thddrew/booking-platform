"use client";

import { AlertTriangleIcon, ClockIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AvailableTimeslot } from "./utils/get-available-timeslots";
import { formatPrice, formatPriceShort } from "./utils/format-price";

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
	eventId: string;
	tenantSlug?: string;
	currency?: string;
	enableWaitlist?: boolean;
}

export function EventBookingPanel({
	timeslots,
	minPrice,
	isFree,
	activePrices,
	hasMultiplePrices,
	eventId,
	tenantSlug,
	currency,
	enableWaitlist,
}: EventBookingPanelProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const presetDtstart = searchParams.get("dtstart");
	const presetDtend = searchParams.get("dtend");

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

	useEffect(() => {
		if (presetDtstart && presetDtend) {
			const presetStart = new Date(presetDtstart);
			const presetEnd = new Date(presetDtend);

			const matchingSlot = timeslots.find((slot) => {
				return (
					slot.dtstart.getTime() === presetStart.getTime() &&
					slot.dtend.getTime() === presetEnd.getTime()
				);
			});

			if (matchingSlot) {
				setSelectedTimeslot(matchingSlot);
				const dateKey = matchingSlot.dtstart.toISOString().split("T")[0];
				setSelectedDate(new Date(dateKey));
			}
		}
	}, [presetDtstart, presetDtend, timeslots]);

	const hasNoPrices = activePrices.length === 0;
	const hasNoTimeslots = availableDates.length === 0;

	const [waitlistEmail, setWaitlistEmail] = useState("");
	const [waitlistName, setWaitlistName] = useState("");
	const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [waitlistMessage, setWaitlistMessage] = useState("");

	async function handleJoinWaitlist(slot: AvailableTimeslot) {
		if (!waitlistEmail) return;
		setWaitlistStatus("loading");
		try {
			const res = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					eventId,
					dtstart: slot.dtstart.toISOString(),
					dtend: slot.dtend.toISOString(),
					scheduleId: slot.scheduleId,
					email: waitlistEmail,
					firstName: waitlistName || undefined,
				}),
			});
			const data = await res.json();
			setWaitlistStatus("success");
			setWaitlistMessage(data.message || "Added to waitlist!");
		} catch {
			setWaitlistStatus("error");
			setWaitlistMessage("Failed to join waitlist. Please try again.");
		}
	}

	return (
		<Card className="rounded-2xl shadow-lg">
			<CardContent className="p-6">
				<div className="flex items-baseline justify-between mb-6">
					<div>
						{!isFree ? (
							<>
								<span className="text-[22px] font-semibold">
									{formatPriceShort(minPrice, currency)}
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
										className={isSelected ? "border border-transparent" : undefined}
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
									<div key={slotKey}>
										<button
											type="button"
											onClick={() => slot.isAvailable ? setSelectedTimeslot(slot) : undefined}
											disabled={!slot.isAvailable && !enableWaitlist}
											className={`
												w-full text-left p-3 rounded-lg border transition-colors
												${isSelected
													? "border-primary bg-primary/5"
													: slot.isAvailable
														? "border-border hover:border-primary/50 hover:bg-muted/50"
														: "border-border bg-muted/30 opacity-60"
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
										{!slot.isAvailable && enableWaitlist && (
											<div className="mt-2 p-3 rounded-lg border border-dashed border-border bg-muted/20">
												{waitlistStatus === "success" ? (
													<p className="text-xs text-green-600 dark:text-green-400 text-center">{waitlistMessage}</p>
												) : (
													<div className="space-y-2">
														<p className="text-xs text-muted-foreground">Get notified when a spot opens:</p>
														<div className="flex gap-2">
															<input
																type="email"
																placeholder="Your email"
																value={waitlistEmail}
																onChange={(e) => setWaitlistEmail(e.target.value)}
																className="flex-1 h-8 px-2 text-xs rounded-md border border-input bg-background"
															/>
															<Button
																type="button"
																size="sm"
																variant="outline"
																className="h-8 text-xs"
																disabled={!waitlistEmail || waitlistStatus === "loading"}
																onClick={() => handleJoinWaitlist(slot)}
															>
																{waitlistStatus === "loading" ? "..." : "Notify me"}
															</Button>
														</div>
														{waitlistStatus === "error" && (
															<p className="text-xs text-destructive">{waitlistMessage}</p>
														)}
													</div>
												)}
											</div>
										)}
									</div>
								);
								})}
							</div>
						</div>
					)}
				</div>
			) : null}

			{(hasNoPrices || hasNoTimeslots) && (
				<div className="mb-6 space-y-3">
					{hasNoPrices && (
						<Alert variant="destructive">
							<AlertTriangleIcon />
							<AlertTitle>No pricing available</AlertTitle>
							<AlertDescription>
								This event does not have any valid pricing options configured.
							</AlertDescription>
						</Alert>
					)}
					{hasNoTimeslots && (
						<Alert variant="destructive">
							<AlertTriangleIcon />
							<AlertTitle>No available times</AlertTitle>
							<AlertDescription>
								There are no available time slots for this event at this time.
							</AlertDescription>
						</Alert>
					)}
				</div>
			)}

			<Button
				size="lg"
				className="w-full rounded-lg"
				disabled={!selectedTimeslot || !selectedTimeslot.isAvailable || activePrices.length === 0}
				onClick={() => {
					if (!selectedTimeslot || !selectedTimeslot.isAvailable || activePrices.length === 0) return;

					// Build checkout URL with booking details
					const params = new URLSearchParams({
						eventId,
						dtstart: selectedTimeslot.dtstart.toISOString(),
						dtend: selectedTimeslot.dtend.toISOString(),
						scheduleId: selectedTimeslot.scheduleId,
					});

					// Determine base path based on current route structure
					// If we're in tenant-slugs, use that; otherwise use tenant-domains
					const currentPath = window.location.pathname;
					const isTenantSlugs = currentPath.includes("/tenant-slugs/");
					const basePath = isTenantSlugs && tenantSlug
						? `/tenant-slugs/${tenantSlug}/checkout`
						: currentPath.includes("/tenant-domains/")
							? `/tenant-domains/${tenantSlug || "checkout"}/checkout`
							: `/checkout`;

					router.push(`${basePath}?${params.toString()}`);
				}}
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
									formatPrice(price.amount, currency)
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
								formatPrice(minPrice, currency)
							)}
						</span>
					</div>
				</div>
			)}
			</CardContent>
		</Card>
	);
}
