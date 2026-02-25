import configPromise from "@payload-config";
import { CalendarIcon, ClockIcon, MailIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "short",
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

function getStatusBadge(status: string | null) {
	switch (status) {
		case "complete":
			return <Badge variant="success">Paid</Badge>;
		case "expired":
			return <Badge variant="destructive">Expired</Badge>;
		case "refunded":
			return <Badge variant="secondary">Refunded</Badge>;
		default:
			return <Badge variant="outline">{status || "Pending"}</Badge>;
	}
}

export default async function BookingHistoryPage({
	params: paramsPromise,
	searchParams: searchParamsPromise,
}: {
	params: Promise<{ tenant: string }>;
	searchParams: Promise<{ email?: string }>;
}) {
	const params = await paramsPromise;
	const searchParams = await searchParamsPromise;
	const { email } = searchParams;

	if (!email) {
		redirect(`/tenant-domains/${params.tenant}/events`);
	}

	const payload = await getPayload({ config: configPromise });

	// Find the tenant
	const tenantsQuery = await payload.find({
		collection: "tenants",
		overrideAccess: true,
		where: {
			domain: { equals: params.tenant },
		},
		limit: 1,
	});

	const tenant = tenantsQuery.docs[0];
	if (!tenant) {
		redirect(`/tenant-domains/${params.tenant}/events`);
	}

	// Find all bookings for this email in this tenant
	const bookingsQuery = await payload.find({
		collection: "bookings",
		overrideAccess: true,
		where: {
			tenant: { equals: tenant.id },
		},
		sort: "-dtstart",
		limit: 50,
	});

	// Filter bookings where customerSnapshot.email matches
	const bookings = bookingsQuery.docs.filter((booking) => {
		if (!booking.customerSnapshot) return false;
		const snapshot =
			typeof booking.customerSnapshot === "string"
				? (() => {
						try {
							return JSON.parse(booking.customerSnapshot);
						} catch {
							return {};
						}
					})()
				: booking.customerSnapshot;
		return snapshot.email === email;
	});

	const now = new Date();
	const upcoming = bookings.filter((b) => new Date(b.dtstart) >= now);
	const past = bookings.filter((b) => new Date(b.dtstart) < now);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<div className="mb-8">
					<h1 className="text-2xl font-semibold">Your Bookings</h1>
					<div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
						<MailIcon className="h-4 w-4" />
						<span>{email}</span>
					</div>
				</div>

				{bookings.length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center">
							<SearchIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
							<h2 className="text-lg font-medium mb-2">No bookings found</h2>
							<p className="text-sm text-muted-foreground mb-6">
								We couldn't find any bookings associated with this email
								address.
							</p>
							<Button asChild>
								<Link href={`/tenant-domains/${params.tenant}/events`}>
									Browse Events
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-8">
						{upcoming.length > 0 && (
							<div>
								<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
									Upcoming ({upcoming.length})
								</h2>
								<div className="space-y-3">
									{upcoming.map((booking) => {
										const eventSnapshot = booking.eventSnapshot
											? typeof booking.eventSnapshot === "string"
												? (() => {
														try {
															return JSON.parse(booking.eventSnapshot);
														} catch {
															return {};
														}
													})()
												: booking.eventSnapshot
											: {};

										return (
											<Link
												key={booking.id}
												href={`/tenant-domains/${params.tenant}/bookings?bookingId=${booking.id}&email=${encodeURIComponent(email)}`}
												className="block"
											>
												<Card className="hover:border-primary/50 transition-colors">
													<CardContent className="py-4">
														<div className="flex items-start justify-between gap-4">
															<div className="min-w-0 flex-1">
																<h3 className="font-medium text-sm truncate">
																	{(eventSnapshot as Record<string, unknown>)
																		.title || "Event"}
																</h3>
																<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
																	<div className="flex items-center gap-1">
																		<CalendarIcon className="h-3 w-3" />
																		<span>{formatDate(booking.dtstart)}</span>
																	</div>
																	<div className="flex items-center gap-1">
																		<ClockIcon className="h-3 w-3" />
																		<span>
																			{formatTime(booking.dtstart)} -{" "}
																			{formatTime(booking.dtend)}
																		</span>
																	</div>
																</div>
															</div>
															{getStatusBadge(booking.paymentStatus)}
														</div>
													</CardContent>
												</Card>
											</Link>
										);
									})}
								</div>
							</div>
						)}

						{past.length > 0 && (
							<div>
								<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
									Past ({past.length})
								</h2>
								<div className="space-y-3">
									{past.map((booking) => {
										const eventSnapshot = booking.eventSnapshot
											? typeof booking.eventSnapshot === "string"
												? (() => {
														try {
															return JSON.parse(booking.eventSnapshot);
														} catch {
															return {};
														}
													})()
												: booking.eventSnapshot
											: {};

										return (
											<Link
												key={booking.id}
												href={`/tenant-domains/${params.tenant}/bookings?bookingId=${booking.id}&email=${encodeURIComponent(email)}`}
												className="block"
											>
												<Card className="hover:border-primary/50 transition-colors opacity-75">
													<CardContent className="py-4">
														<div className="flex items-start justify-between gap-4">
															<div className="min-w-0 flex-1">
																<h3 className="font-medium text-sm truncate">
																	{(eventSnapshot as Record<string, unknown>)
																		.title || "Event"}
																</h3>
																<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
																	<div className="flex items-center gap-1">
																		<CalendarIcon className="h-3 w-3" />
																		<span>{formatDate(booking.dtstart)}</span>
																	</div>
																	<div className="flex items-center gap-1">
																		<ClockIcon className="h-3 w-3" />
																		<span>
																			{formatTime(booking.dtstart)} -{" "}
																			{formatTime(booking.dtend)}
																		</span>
																	</div>
																</div>
															</div>
															{getStatusBadge(booking.paymentStatus)}
														</div>
													</CardContent>
												</Card>
											</Link>
										);
									})}
								</div>
							</div>
						)}
					</div>
				)}

				<Separator className="my-8" />

				<div className="flex justify-center">
					<Button asChild variant="outline">
						<Link href={`/tenant-domains/${params.tenant}/events`}>
							Browse More Events
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
