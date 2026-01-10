import configPromise from "@payload-config";
import { CalendarIcon, CheckCircle2Icon, ClockIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export default async function CheckoutSuccessPage({
	params: paramsPromise,
	searchParams: searchParamsPromise,
}: {
	params: Promise<{ tenant: string }>;
	searchParams: Promise<{
		bookingId?: string;
		email?: string;
	}>;
}) {
	const params = await paramsPromise;
	const searchParams = await searchParamsPromise;

	const { bookingId, email } = searchParams;

	if (!bookingId) {
		return notFound();
	}

	const payload = await getPayload({ config: configPromise });

	// Fetch booking with email validation for guest access
	const bookingsQuery = await payload.find({
		collection: "bookings",
		overrideAccess: true,
		where: {
			id: {
				equals: bookingId,
			},
		},
		limit: 1,
	});

	const booking = bookingsQuery.docs[0];

	if (!booking) {
		return notFound();
	}

	// Parse customer snapshot for display and email validation
	let customerSnapshot: { email?: string; firstName?: string; lastName?: string } = {};
	if (booking.customerSnapshot) {
		if (typeof booking.customerSnapshot === "string") {
			try {
				customerSnapshot = JSON.parse(booking.customerSnapshot);
			} catch {
				customerSnapshot = {};
			}
		} else if (typeof booking.customerSnapshot === "object") {
			customerSnapshot = booking.customerSnapshot as typeof customerSnapshot;
		}
	}

	// For guest bookings, validate email matches
	if (email && customerSnapshot.email && customerSnapshot.email !== email) {
		return notFound();
	}

	// Parse event snapshot for display
	let eventSnapshot: { title?: string; subtitle?: string; thumbnail?: { url?: string } } = {};
	if (booking.eventSnapshot) {
		if (typeof booking.eventSnapshot === "string") {
			try {
				eventSnapshot = JSON.parse(booking.eventSnapshot);
			} catch {
				eventSnapshot = {};
			}
		} else if (typeof booking.eventSnapshot === "object") {
			eventSnapshot = booking.eventSnapshot as typeof eventSnapshot;
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-12 max-w-2xl">
				{/* Success Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
						<CheckCircle2Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
					</div>
					<h1 className="text-2xl font-semibold mb-2">Booking Confirmed!</h1>
					<p className="text-muted-foreground">
						Your booking has been successfully created.
					</p>
				</div>

				{/* Booking Details Card */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="text-lg">Booking Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Event Info */}
						<div className="flex gap-4">
							{eventSnapshot.thumbnail?.url && (
								<div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
									<img
										src={eventSnapshot.thumbnail.url}
										alt={eventSnapshot.title || "Event"}
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<div className="min-w-0">
								<h3 className="font-medium text-base">
									{eventSnapshot.title || "Event"}
								</h3>
								{eventSnapshot.subtitle && (
									<p className="text-sm text-muted-foreground">
										{eventSnapshot.subtitle}
									</p>
								)}
							</div>
						</div>

						<Separator />

						{/* Date & Time */}
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

						{/* Customer Info */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								Booked by
							</h4>
							<p className="text-sm">
								{customerSnapshot.firstName} {customerSnapshot.lastName}
							</p>
							{customerSnapshot.email && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<MailIcon className="h-4 w-4" />
									<span>{customerSnapshot.email}</span>
								</div>
							)}
						</div>

						<Separator />

						{/* Booking Reference */}
						<div className="space-y-2">
							<h4 className="text-sm font-medium text-muted-foreground">
								Booking Reference
							</h4>
							<p className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
								{booking.id}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Confirmation Message */}
				<Card className="mb-6 bg-muted/50">
					<CardContent className="pt-6">
						<div className="flex gap-3">
							<MailIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
							<div>
								<p className="text-sm">
									A confirmation email has been sent to{" "}
									<span className="font-medium">{customerSnapshot.email}</span>
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Please save this page or check your email for your booking details.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Actions */}
				<div className="flex flex-col sm:flex-row gap-3">
					<Button asChild className="flex-1">
						<Link href={`/tenant-slugs/${params.tenant}/events`}>
							Browse More Events
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
