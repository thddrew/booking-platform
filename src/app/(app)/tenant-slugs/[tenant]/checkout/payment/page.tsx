import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getBookingForPayment, getTenantStripeAccount } from "@/app/components/RenderPage/checkout-actions";
import { PaymentCheckout } from "@/app/components/RenderPage/PaymentCheckout";
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

function LoadingState() {
	return (
		<div className="flex items-center justify-center py-12">
			<Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
		</div>
	);
}

export default async function PaymentPage({
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

	if (!bookingId || !email) {
		redirect(`/tenant-slugs/${params.tenant}/events`);
	}

	// Get booking details
	const bookingResult = await getBookingForPayment(bookingId, email);

	if (!bookingResult.success || !bookingResult.booking) {
		return notFound();
	}

	const { booking } = bookingResult;

	// Get Stripe account for this tenant
	const stripeResult = await getTenantStripeAccount(booking.tenantId);

	if (!stripeResult.stripeAccountId) {
		return (
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-12 max-w-2xl">
					<Card>
						<CardContent className="pt-6">
							<p className="text-center text-muted-foreground">
								Payment is not available for this event. Please contact the organizer.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Calculate total from pricing snapshot
	const prices = Object.values(booking.pricingSnapshot) as Array<{ amount?: number; label?: string; quantity?: number }>;
	const totalAmount = prices.reduce((sum, p) => sum + (p.amount || 0) * (p.quantity || 1), 0);

	// Extract event info
	const eventSnapshot = booking.eventSnapshot as { title?: string; subtitle?: string; thumbnail?: { url?: string } };

	// Build success and cancel URLs
	const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL || "";
	const successUrl = `${baseUrl}/tenant-slugs/${params.tenant}/checkout/success?bookingId=${bookingId}&email=${encodeURIComponent(email)}`;
	const cancelUrl = `${baseUrl}/tenant-slugs/${params.tenant}/checkout/payment?bookingId=${bookingId}&email=${encodeURIComponent(email)}`;

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link
						href={`/tenant-slugs/${params.tenant}/events`}
						className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon className="h-4 w-4" />
						<span>Cancel</span>
					</Link>
				</div>
			</div>

			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-semibold mb-8">Complete Payment</h1>

				<div className="grid md:grid-cols-[1fr_360px] gap-8">
					{/* Payment Form */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Payment Details</CardTitle>
							</CardHeader>
							<CardContent>
								<Suspense fallback={<LoadingState />}>
									<PaymentCheckout
										bookingId={bookingId}
										tenantId={booking.tenantId}
										stripeAccountId={stripeResult.stripeAccountId}
										customerEmail={booking.customerEmail}
										pricingSnapshot={booking.pricingSnapshot}
										successUrl={successUrl}
										cancelUrl={cancelUrl}
									/>
								</Suspense>
							</CardContent>
						</Card>
					</div>

					{/* Order Summary */}
					<div>
						<Card className="sticky top-4">
							<CardHeader>
								<CardTitle className="text-lg">Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Event Info */}
								<div className="flex gap-4">
									{eventSnapshot.thumbnail?.url && (
										<div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
											<img
												src={eventSnapshot.thumbnail.url}
												alt={eventSnapshot.title || "Event"}
												className="w-full h-full object-cover"
											/>
										</div>
									)}
									<div className="min-w-0">
										<h3 className="font-medium text-sm truncate">
											{eventSnapshot.title || "Event"}
										</h3>
										<p className="text-xs text-muted-foreground mt-1">
											{formatDate(booking.dtstart)}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatTime(booking.dtstart)} - {formatTime(booking.dtend)}
										</p>
									</div>
								</div>

								<Separator />

								{/* Line Items */}
								<div className="space-y-2">
									{prices.map((price, index) => (
										<div
											key={index}
											className="flex items-center justify-between text-sm"
										>
											<span className="text-muted-foreground">
												{price.label || "Ticket"} x {price.quantity || 1}
											</span>
											<span>${((price.amount || 0) * (price.quantity || 1)).toFixed(2)}</span>
										</div>
									))}
								</div>

								<Separator />

								{/* Total */}
								<div className="flex items-center justify-between font-medium">
									<span>Total</span>
									<span className="text-lg">${totalAmount.toFixed(2)}</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
