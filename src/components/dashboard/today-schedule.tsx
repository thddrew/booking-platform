"use client";

import { formatDate } from "date-fns";
import {
	CalendarCheckIcon,
	ChevronDownIcon,
	ClockIcon,
	ExternalLinkIcon,
	MailIcon,
	PhoneIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PAYMENT_METHODS } from "@/collections/Bookings/utils/payment-methods";
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
	}>;
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
			});
		}

		return Array.from(map.values()).sort(
			(a, b) => a.dtstart.getTime() - b.dtstart.getTime(),
		);
	}, [bookings]);

	const totalGuests = grouped.reduce(
		(sum, g) => sum + g.bookings.reduce((s, b) => s + b.guestCount, 0),
		0,
	);
	const totalPaid = bookings.filter(
		(b) =>
			b.paymentStatus === "complete" ||
			(b.paymentMethod as string) === "payLater",
	).length;
	const totalPending = bookings.length - totalPaid;

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

			{/* Summary card */}
			<Card className="mb-4 bg-primary/5 border-primary/20">
				<CardContent className="py-4">
					<div className="flex items-center gap-6 text-sm">
						<div className="flex items-center gap-2">
							<UsersIcon className="h-4 w-4 text-primary" />
							<span className="font-semibold">
								{totalGuests} guest{totalGuests !== 1 ? "s" : ""}
							</span>
							<span className="text-muted-foreground">
								across {grouped.length} event{grouped.length !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs">
							{totalPaid > 0 && (
								<span className="text-green-600">{totalPaid} paid</span>
							)}
							{totalPending > 0 && (
								<span className="text-amber-600">{totalPending} pending</span>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Event blocks */}
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
	const [open, setOpen] = useState(true);

	return (
		<Card>
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
									<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
										<UserIcon className="h-4 w-4 text-primary" />
									</div>
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
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
