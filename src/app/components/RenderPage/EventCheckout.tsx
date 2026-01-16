"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, Loader2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Event, User } from "@/payload-types";
import { createGuestBooking } from "./checkout-actions";

// Form validation schema
const customerInfoSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().optional(),
});

type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

interface SelectedTimeslot {
	dtstart: Date;
	dtend: Date;
	scheduleId: string;
}

interface EventCheckoutProps {
	event: Event;
	selectedTimeslot: SelectedTimeslot;
	tenantId: string;
	tenantSlug: string;
	user?: User;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
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

export function EventCheckout({
	event,
	selectedTimeslot,
	tenantId,
	tenantSlug,
	user,
}: EventCheckoutProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const activePrices = event.prices || [];
	const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>(() => {
		const initial: Record<string, number> = {};
		activePrices.forEach((price) => {
			if (price.id) {
				initial[price.id] = 0;
			}
		});
		return initial;
	});

	const selectedLineItems = useMemo(() => {
		return activePrices
			.filter((price) => price.id && (selectedPrices[price.id] ?? 0) > 0)
			.map((price) => ({
				...price,
				quantity: selectedPrices[price.id as string] ?? 0,
				quantityUnit: price.quantityUnit ?? 1,
			}));
	}, [activePrices, selectedPrices]);
	const totalGuests = selectedLineItems.reduce(
		(sum, price) => sum + price.quantity * (price.quantityUnit ?? 1),
		0,
	);
	const totalPrice = selectedLineItems.reduce(
		(sum, price) => sum + price.amount * price.quantity,
		0,
	);

	const form = useForm<CustomerInfoFormData>({
		resolver: zodResolver(customerInfoSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
		},
	});

	const onSubmit = (data: CustomerInfoFormData) => {
		setError(null);

		startTransition(async () => {
			try {
				if (totalGuests === 0) {
					setError("Please select at least one pricing option");
					return;
				}
				if (totalGuests > event.maxQuantity) {
					setError(`Please select at most ${event.maxQuantity} guests`);
					return;
				}
				console.log("Creating booking with payload", {
					eventId: event.id,
					tenantId,
					dtstart: selectedTimeslot.dtstart.toISOString(),
					dtend: selectedTimeslot.dtend.toISOString(),
					scheduleId: selectedTimeslot.scheduleId,
					customerInfo: {
						firstName: data.firstName,
						lastName: data.lastName,
						email: data.email,
						phone: data.phone || undefined,
					},
					selectedPrices,
				});
				const result = await createGuestBooking({
					eventId: event.id,
					tenantId,
					dtstart: selectedTimeslot.dtstart.toISOString(),
					dtend: selectedTimeslot.dtend.toISOString(),
					scheduleId: selectedTimeslot.scheduleId,
					customerInfo: {
						firstName: data.firstName,
						lastName: data.lastName,
						email: data.email,
						phone: data.phone || undefined,
					},
					selectedPrices,
				});

				if (result.success && result.bookingId) {
					// Always redirect to payment page (includes $0 pricing if applicable)
					router.push(
						`/tenant-slugs/${tenantSlug}/checkout/payment?bookingId=${result.bookingId}&email=${encodeURIComponent(data.email)}`
					);
				} else {
					setError(result.error || "Failed to create booking");
				}
			} catch (err) {
				console.error("Checkout error:", err);
				setError(err instanceof Error ? err.message : "An unexpected error occurred");
			}
		});
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link
						href={`/tenant-slugs/${tenantSlug}/events/${event.slug}`}
						className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon className="h-4 w-4" />
						<span>Back to event</span>
					</Link>
				</div>
			</div>

			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<h1 className="text-2xl font-semibold mb-8">Complete your booking</h1>

				<div className="grid md:grid-cols-[1fr_360px] gap-8">
					{/* Customer Info Form */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Your Information</CardTitle>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
										<div className="grid sm:grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="firstName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>First name</FormLabel>
														<FormControl>
															<Input placeholder="John" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="lastName"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Last name</FormLabel>
														<FormControl>
															<Input placeholder="Doe" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input
															type="email"
															placeholder="john@example.com"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Phone (optional)</FormLabel>
													<FormControl>
														<Input
															type="tel"
															placeholder="+1 (555) 123-4567"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{error && (
											<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
												<p className="text-sm text-destructive">{error}</p>
											</div>
										)}

										<Button
											type="submit"
											size="lg"
											className="w-full"
											disabled={isPending}
										>
											{isPending ? (
												<>
													<Loader2Icon className="h-4 w-4 animate-spin mr-2" />
													Processing...
												</>
											) : (
												"Continue to Payment"
											)}
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</div>

					{/* Booking Summary */}
					<div>
						<Card className="sticky top-4">
							<CardHeader>
								<CardTitle className="text-lg">Booking Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Event Info */}
								<div className="flex gap-4">
									{event.thumbnail &&
										typeof event.thumbnail === "object" &&
										"url" in event.thumbnail &&
										event.thumbnail.url && (
											<div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
												<img
													src={event.thumbnail.url}
													alt={event.title}
													className="w-full h-full object-cover"
												/>
											</div>
										)}
									<div className="min-w-0">
										<h3 className="font-medium text-base truncate">{event.title}</h3>
									</div>
								</div>

								<Separator />

								{/* Date & Time */}
								<div className="space-y-3">
									<div className="flex items-center gap-3 text-sm">
										<CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										<span>{formatDate(selectedTimeslot.dtstart)}</span>
									</div>
									<div className="flex items-center gap-3 text-sm">
										<ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										<span>
											{formatTime(selectedTimeslot.dtstart)} -{" "}
											{formatTime(selectedTimeslot.dtend)}
										</span>
									</div>
									<div className="flex items-center gap-3 text-sm">
										<UsersIcon className="h-4 w-4 text-muted-foreground shrink-0" />
										<span>{totalGuests} guest{totalGuests === 1 ? "" : "s"}</span>
									</div>
								</div>

								{/* Pricing */}
								{activePrices.length > 0 && (
									<>
										<Separator />
										<div className="space-y-3">
											{activePrices.map((price) => (
												<div key={price.id} className="flex items-center justify-between gap-3">
													<div className="text-sm">
														<div className="font-medium">{price.label}</div>
														<div className="text-muted-foreground">
															{price.amount === 0 ? "Free" : `$${price.amount.toFixed(2)}`}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																if (!price.id) return;
																setSelectedPrices((prev) => ({
																	...prev,
																	[price.id as string]: Math.max(0, (prev[price.id as string] ?? 0) - 1),
																}));
															}}
														>
															-
														</Button>
														<span className="w-6 text-center">
															{selectedPrices[price.id as string] ?? 0}
														</span>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => {
																if (!price.id) return;
																const quantityUnit = price.quantityUnit ?? 1;
																const nextTotalGuests = totalGuests + quantityUnit;
																if (nextTotalGuests > event.maxQuantity) {
																	return;
																}
																setSelectedPrices((prev) => ({
																	...prev,
																	[price.id as string]: (prev[price.id as string] ?? 0) + 1,
																}));
															}}
														>
															+
														</Button>
													</div>
												</div>
											))}
										</div>
									</>
								)}

								<Separator />

								{/* Total */}
								<div className="flex items-center justify-between font-medium">
									<span>Total</span>
									<span className="text-lg">
										{totalPrice === 0 ? "Free" : `$${totalPrice.toFixed(2)}`}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
