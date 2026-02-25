"use client";

import {
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	MailIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingCancelButton } from "./booking-cancel-button";

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function formatTime(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}

function getPaymentStatusBadge(status: string | null) {
	switch (status) {
		case "paid":
			return <Badge variant="success">Paid</Badge>;
		case "unpaid":
			return <Badge variant="warning">Unpaid</Badge>;
		case "refunded":
			return <Badge variant="secondary">Refunded</Badge>;
		default:
			return <Badge variant="outline">{status || "Pending"}</Badge>;
	}
}

interface BookingDetailsClientProps {
	booking: {
		id: string;
		dtstart: string;
		dtend: string;
		paymentStatus: string | null;
		customerSnapshot: {
			email?: string;
			firstName?: string;
			lastName?: string;
		};
		eventSnapshot: {
			title?: string;
			subtitle?: string;
			thumbnail?: { url?: string };
		};
	};
	email: string;
	eventsPath: string;
}

export function BookingDetailsClient({
	booking,
	email,
	eventsPath,
}: BookingDetailsClientProps) {
	const [isCancelled, setIsCancelled] = useState(false);

	if (isCancelled) {
		return (
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-12 max-w-2xl">
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
							<XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
						</div>
						<h1 className="text-2xl font-semibold mb-2">Booking Cancelled</h1>
						<p className="text-muted-foreground">
							Your booking for{" "}
							<span className="font-medium">
								{booking.eventSnapshot.title || "the event"}
							</span>{" "}
							has been successfully cancelled.
						</p>
					</div>

					<Card className="mb-6 bg-muted/50">
						<CardContent className="pt-6">
							<div className="flex gap-3">
								<MailIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
								<div>
									<p className="text-sm">
										A cancellation confirmation email will be sent to{" "}
										<span className="font-medium">{email}</span>
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										If you have any questions, please contact the event
										organizer.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="flex flex-col sm:flex-row gap-3">
						<Button asChild className="flex-1">
							<Link href={eventsPath}>Browse Events</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-12 max-w-2xl">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
						<CheckCircle2Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
					</div>
					<h1 className="text-2xl font-semibold mb-2">Your Booking</h1>
					<p className="text-muted-foreground">
						View your booking details below.
					</p>
				</div>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Booking Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-4">
							{booking.eventSnapshot.thumbnail?.url && (
								<div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
									<img
										src={booking.eventSnapshot.thumbnail.url}
										alt={booking.eventSnapshot.title || "Event"}
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<div className="min-w-0">
								<h3 className="font-medium text-base">
									{booking.eventSnapshot.title || "Event"}
								</h3>
								{booking.eventSnapshot.subtitle && (
									<p className="text-sm text-muted-foreground">
										{booking.eventSnapshot.subtitle}
									</p>
								)}
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<div className="flex items-center gap-3 text-sm">
								<CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
								<span>{formatDate(booking.dtstart)}</span>
							</div>
							<div className="flex items-center gap-3 text-sm">
								<ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
								<span>
									{formatTime(booking.dtstart)} - {formatTime(booking.dtend)}
								</span>
							</div>
						</div>

						<Separator />

						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								Booked by
							</h4>
							<p className="text-sm">
								{booking.customerSnapshot.firstName}{" "}
								{booking.customerSnapshot.lastName}
							</p>
							{booking.customerSnapshot.email && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MailIcon className="h-4 w-4" />
									<span>{booking.customerSnapshot.email}</span>
								</div>
							)}
						</div>

						<Separator />

						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								Booking Reference
							</h4>
							<p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
								{booking.id}
							</p>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium text-muted-foreground">
								Payment Status
							</h4>
							{getPaymentStatusBadge(booking.paymentStatus)}
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Reschedule</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Need to change the date or time? You can reschedule to a different
							available timeslot.
						</p>
						<Button asChild variant="outline" className="w-full">
							<Link
								href={`${eventsPath.replace("/events", "/bookings/reschedule")}?bookingId=${booking.id}&email=${encodeURIComponent(email)}`}
							>
								Reschedule Booking
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Cancel Booking</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Need to cancel? You can cancel your booking below. This action
							cannot be undone.
						</p>
						<BookingCancelButton
							bookingId={booking.id}
							email={email}
							onCancelled={() => setIsCancelled(true)}
						/>
					</CardContent>
				</Card>

				<div className="flex flex-col sm:flex-row gap-3">
					<Button asChild variant="outline" className="flex-1">
						<Link href={eventsPath}>Browse More Events</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
