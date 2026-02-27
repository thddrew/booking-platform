"use client";

import { formatDate } from "date-fns";
import {
	CalendarCheckIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ClockIcon,
	DollarSignIcon,
	ExternalLinkIcon,
	MailIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PAYMENT_METHODS } from "@/collections/Bookings/utils/payment-methods";
import type { Booking } from "@/payload-types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import { useBookingsToday } from "./utils/use-bookings-today";

interface CustomerInfo {
	firstName?: string;
	lastName?: string;
	fullName?: string;
	email?: string;
	phone?: string | null;
}

interface EventInfo {
	id?: string;
	title?: string;
	maxQuantity?: number;
}

function parseSnapshot<T>(raw: unknown): T {
	if (!raw) return {} as T;
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw);
		} catch {
			return {} as T;
		}
	}
	return raw as T;
}

function getPaymentBadge(status: string | null, method: string | null) {
	if (method === PAYMENT_METHODS.payLater) {
		return (
			<Badge variant="outline" className="text-xs">
				Pay at door
			</Badge>
		);
	}
	switch (status) {
		case "complete":
			return (
				<Badge variant="success" className="text-xs">
					Paid
				</Badge>
			);
		case "expired":
			return (
				<Badge variant="destructive" className="text-xs">
					Expired
				</Badge>
			);
		case "refunded":
			return (
				<Badge variant="secondary" className="text-xs">
					Refunded
				</Badge>
			);
		case "processing":
			return (
				<Badge variant="warning" className="text-xs">
					Processing
				</Badge>
			);
		default:
			return (
				<Badge variant="outline" className="text-xs">
					Pending
				</Badge>
			);
	}
}

interface GroupedEvent {
	eventId: string;
	eventTitle: string;
	time: string;
	dtstart: Date;
	maxQuantity: number;
	bookings: Array<{
		id: string;
		customer: CustomerInfo;
		paymentStatus: string | null;
		paymentMethod: string | null;
		guestCount: number;
		checkedIn: boolean;
	}>;
}

function DaySummary({
	grouped,
	bookings,
}: {
	grouped: GroupedEvent[];
	bookings: Booking[];
}) {
	const totalGuests = grouped.reduce(
		(sum, g) => sum + g.bookings.reduce((s, b) => s + b.guestCount, 0),
		0,
	);

	const paidBookings = bookings.filter((b) => b.paymentStatus === "complete");
	const payLaterBookings = bookings.filter(
		(b) => (b.paymentMethod as string) === "payLater",
	);
	const pendingBookings = bookings.filter(
		(b) =>
			b.paymentStatus !== "complete" &&
			(b.paymentMethod as string) !== "payLater",
	);

	let collectedRevenue = 0;
	let pendingRevenue = 0;
	for (const booking of bookings) {
		try {
			const pricing = booking.pricingSnapshot as Record<
				string,
				{ amount?: number; quantity?: number }
			> | null;
			if (!pricing) continue;
			const bookingTotal = Object.values(pricing).reduce(
				(sum, p) => sum + (p.amount || 0) * (p.quantity || 1),
				0,
			);
			if (booking.paymentStatus === "complete") {
				collectedRevenue += bookingTotal;
			} else {
				pendingRevenue += bookingTotal;
			}
		} catch {}
	}

	const totalRevenue = collectedRevenue + pendingRevenue;

	const now = new Date();
	const nextEvent = grouped.find((g) => g.dtstart > now);
	const timeUntilNext = nextEvent
		? Math.max(
				0,
				Math.round((nextEvent.dtstart.getTime() - now.getTime()) / 60000),
			)
		: null;

	const formatTimeUntil = (minutes: number) => {
		if (minutes < 60) return `${minutes}m`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	};

	return (
		<>
			{/* Revenue card */}
			<Card>
				<CardContent className="pt-5 pb-5">
					<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
						<DollarSignIcon className="h-3.5 w-3.5" />
						Today's Revenue
					</div>
					<p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
					<div className="flex items-center gap-3 mt-2 text-xs">
						{collectedRevenue > 0 && (
							<span className="text-green-600">
								${collectedRevenue.toFixed(2)} collected
							</span>
						)}
						{pendingRevenue > 0 && (
							<span className="text-amber-600">
								${pendingRevenue.toFixed(2)} pending
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Quick stats */}
			<Card>
				<CardContent className="pt-5 pb-5 space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Total guests</span>
						<span className="text-sm font-semibold">{totalGuests}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Events</span>
						<span className="text-sm font-semibold">{grouped.length}</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Paid</span>
						<span className="text-sm font-semibold text-green-600">
							{paidBookings.length + payLaterBookings.length}
						</span>
					</div>
					{pendingBookings.length > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-amber-600 font-medium">
								Needs follow-up
							</span>
							<span className="text-sm font-semibold text-amber-600">
								{pendingBookings.length}
							</span>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Next up */}
			{nextEvent && timeUntilNext !== null && (
				<Card className="border-primary/20 bg-primary/5">
					<CardContent className="pt-5 pb-5">
						<div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
							<ClockIcon className="h-3.5 w-3.5" />
							Next up
						</div>
						<p className="text-sm font-semibold">{nextEvent.eventTitle}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{nextEvent.time} · starts in {formatTimeUntil(timeUntilNext)}
						</p>
					</CardContent>
				</Card>
			)}
		</>
	);
}

export function TodaySchedule() {
	const { data } = useBookingsToday(new Date());
	const bookings = data?.docs ?? [];

	const grouped = useMemo(() => {
		const map = new Map<string, GroupedEvent>();

		for (const booking of bookings) {
			const event = parseSnapshot<EventInfo>(booking.eventSnapshot);
			const customer = parseSnapshot<CustomerInfo>(booking.customerSnapshot);
			const eventKey = `${event.id || "unknown"}-${booking.dtstart}`;

			if (!map.has(eventKey)) {
				map.set(eventKey, {
					eventId: event.id || "",
					eventTitle: event.title || "Event",
					time: formatDate(new Date(booking.dtstart), "h:mm a"),
					dtstart: new Date(booking.dtstart),
					maxQuantity: event.maxQuantity || 0,
					bookings: [],
				});
			}

			let guestCount = 1;
			try {
				const pricing = booking.pricingSnapshot as Record<
					string,
					{ quantity?: number; quantityUnit?: number }
				> | null;
				if (pricing) {
					guestCount = Object.values(pricing).reduce(
						(sum, p) => sum + (p.quantity || 1) * (p.quantityUnit || 1),
						0,
					);
				}
			} catch {}

			map.get(eventKey)?.bookings.push({
				id: booking.id,
				customer,
				paymentStatus: booking.paymentStatus,
				paymentMethod: booking.paymentMethod || null,
				guestCount: Math.max(1, guestCount),
				checkedIn: (booking as any).checkedIn || false,
			});
		}

		return Array.from(map.values()).sort(
			(a, b) => a.dtstart.getTime() - b.dtstart.getTime(),
		);
	}, [bookings]);

	if (bookings.length === 0) {
		return (
			<div className="twp">
				<h3 className="font-bold text-xl mb-4">Today's Schedule</h3>
				<Card>
					<CardContent className="py-12 text-center">
						<CalendarCheckIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
						<p className="text-muted-foreground">No bookings today</p>
						<p className="text-xs text-muted-foreground mt-1">
							Your upcoming bookings will appear here
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="twp">
			<h3 className="font-bold text-xl mb-4">Today's Schedule</h3>
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
				{/* Left column — check-in list */}
				<div className="space-y-3">
					{grouped.map((group) => {
						const totalInGroup = group.bookings.reduce(
							(s, b) => s + b.guestCount,
							0,
						);

						return (
							<EventBlock
								key={`${group.eventId}-${group.dtstart.toISOString()}`}
								group={group}
								totalGuests={totalInGroup}
							/>
						);
					})}
				</div>

				{/* Right column — day summary */}
				<div className="space-y-4">
					<DaySummary grouped={grouped} bookings={bookings} />
				</div>
			</div>
		</div>
	);
}

function EventBlock({
	group,
	totalGuests,
}: {
	group: GroupedEvent;
	totalGuests: number;
}) {
	const isPast = group.dtstart < new Date();
	const [open, setOpen] = useState(true);

	return (
		<Card className={isPast ? "opacity-60" : ""}>
			<Collapsible open={open} onOpenChange={setOpen}>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-xl"
					>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<ClockIcon className="h-4 w-4 text-muted-foreground" />
								{group.time}
							</div>
							<span className="text-sm font-medium">{group.eventTitle}</span>
							{isPast && (
								<Badge variant="secondary" className="text-xs">
									Completed
								</Badge>
							)}
						</div>
						<div className="flex items-center gap-3">
							<span className="text-xs text-muted-foreground">
								{totalGuests} / {group.maxQuantity} spots
							</span>
							<ChevronDownIcon
								className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
							/>
						</div>
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="px-4 pb-4 space-y-2">
						{group.bookings.map((booking) => (
							<div
								key={booking.id}
								className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-3 min-w-0">
									<button
										type="button"
										title={
											booking.checkedIn
												? "Checked in — click to undo"
												: "Click to check in"
										}
										onClick={async () => {
											try {
												await fetch(`/api/bookings/${booking.id}`, {
													method: "PATCH",
													headers: { "Content-Type": "application/json" },
													credentials: "include",
													body: JSON.stringify({
														checkedIn: !booking.checkedIn,
													}),
												});
												window.location.reload();
											} catch {
												// silently fail
											}
										}}
										className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 cursor-pointer transition-all hover:scale-110 ${
											booking.checkedIn
												? "bg-green-100 ring-2 ring-green-500"
												: "bg-primary/10 hover:bg-green-50 hover:ring-1 hover:ring-green-300"
										}`}
									>
										{booking.checkedIn ? (
											<CheckCircle2Icon className="h-4 w-4 text-green-600" />
										) : (
											<UserIcon className="h-4 w-4 text-primary" />
										)}
									</button>
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">
											{booking.customer.fullName ||
												`${booking.customer.firstName || ""} ${booking.customer.lastName || ""}`.trim() ||
												"Guest"}
										</p>
										<div className="flex items-center gap-3 text-xs text-muted-foreground">
											{booking.customer.email && (
												<a
													href={`mailto:${booking.customer.email}`}
													className="flex items-center gap-1 hover:text-foreground"
												>
													<MailIcon className="h-3 w-3" />
													{booking.customer.email}
												</a>
											)}
											{booking.customer.phone && (
												<a
													href={`tel:${booking.customer.phone}`}
													className="flex items-center gap-1 hover:text-foreground"
												>
													<PhoneIcon className="h-3 w-3" />
													{booking.customer.phone}
												</a>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{booking.guestCount > 1 && (
										<span className="text-xs text-muted-foreground">
											{booking.guestCount} guests
										</span>
									)}
									{getPaymentBadge(
										booking.paymentStatus,
										booking.paymentMethod,
									)}
									<Link href={`/admin/collections/bookings/${booking.id}`}>
										<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
											<ExternalLinkIcon className="h-3.5 w-3.5" />
										</Button>
									</Link>
								</div>
							</div>
						))}
						{group.bookings.length > 0 && (
							<div className="pt-2 border-t mt-2">
								<a
									href={`mailto:${group.bookings
										.map((b) => b.customer.email)
										.filter(Boolean)
										.join(",")}`}
									className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									<MailIcon className="h-3 w-3" />
									Email all attendees
								</a>
							</div>
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
