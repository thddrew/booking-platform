"use client";

/**
 * Must be wrapped in a CheckoutProvider
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
	BillingAddressElement,
	PaymentElement,
	useCheckout,
} from "@stripe/react-stripe-js/checkout";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PAYMENT_STATUS } from "@/collections/Bookings/components/utils/payment-statuses";
import { payloadSDK } from "@/lib/payload/payload-sdk";
import { ConfirmDialog } from "../confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { DialogClose, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import CheckoutFormSkeleton from "./checkout-form-skeleton";
import { useCheckoutDetails } from "./checkout-provider";

const formSchema = z.object({
	email: z.string().email(),
});

export const CheckoutForm = ({ header }: { header?: React.ReactNode }) => {
	const {
		stCusId: stripeCustomerId,
		stCusEmail: stripeCustomerEmail,
		bookingId,
		cancelUrl,
	} = useCheckoutDetails();
	const checkoutState = useCheckout();

	const [confirming, setConfirming] = useState<boolean>(false);
	const [reviewPaymentOpen, setReviewPaymentOpen] = useState<boolean>(false);
	const [rootError, setRootError] = useState<string | null>(null);

	const form = useForm<z.infer<typeof formSchema>>({
		defaultValues: {
			email: stripeCustomerEmail ?? "",
		},
		resolver: zodResolver(formSchema),
	});

	const validateStripeEmail = async (_email: string) => {
		if (checkoutState.type === "success") {
			const { checkout } = checkoutState;
			const result = await checkout.updateEmail(_email);
			const isValid = result.type === "success";

			return {
				isValid,
				message: isValid ? "Email updated successfully" : result.error?.message,
			};
		}

		return {
			isValid: false,
			message: "Stripe is not ready for payment yet",
		};
	};

	const onSubmit = async () => {
		const data = form.getValues();
		setReviewPaymentOpen(false);
		setRootError(null);

		try {
			if (!stripeCustomerId) {
				const { isValid, message } = await validateStripeEmail(data.email);

				if (!isValid) {
					form.setError("email", { message });

					return;
				}
			}

			if (checkout.canConfirm) {
				setConfirming(true);

				// We pre-emptively update because once the checkout is confirmed,
				// we are automatically redirected to the checkout success page.
				// Doing this in the checkout success page requires us to re-validate the
				// checkout session because the url params may be manually constructed/modified.
				await payloadSDK.update({
					collection: "bookings",
					id: bookingId,
					data: {
						stripeCheckoutSessionId: checkout.id,
						paymentStatus: PAYMENT_STATUS.processing,
					},
				});

				const confirmResult = await checkout.confirm();

				if (confirmResult.type === "error") {
					setRootError(confirmResult.error?.message);

					// If it fails, we reset the checkout session id
					// TODO: find a better way to handle this eg. webhooks
					await payloadSDK.update({
						collection: "bookings",
						id: bookingId,
						data: {
							stripeCheckoutSessionId: null,
							paymentStatus: null,
						},
					});

					return;
				}

				return;
			}

			throw new Error("Checkout cannot be confirmed");
		} catch (err) {
			console.error(err);
			setRootError(
				err instanceof Error ? err.message : "An unknown error occurred",
			);
		} finally {
			setConfirming(false);
		}
	};

	if (checkoutState.type === "loading") {
		return <CheckoutFormSkeleton />;
	}

	if (checkoutState.type === "error") {
		return (
			<div className="twp">
				<p className="text-destructive">{checkoutState.error?.message}</p>
			</div>
		);
	}

	const { checkout } = checkoutState;

	const formId = `checkout-form-${checkout.id}`;

	return (
		<form
			id={formId}
			className="twp space-y-6 max-w-2xl mx-auto"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			{header}
			<div>
				<p className="font-bold mb-2 text-lg">Summary:</p>
				<ul className="space-y-1">
					{checkout.lineItems.map((lineItem) => (
						<li key={lineItem.id} className="flex justify-between items-center">
							<p>
								{lineItem.name} x {lineItem.quantity}
							</p>
							<p>{lineItem.subtotal.amount}</p>
						</li>
					))}
				</ul>
				<Separator className="my-4" />
				<div className="grid grid-cols-2 gap-y-1">
					<p className="text-muted-foreground">Subtotal:</p>
					<p className="text-muted-foreground text-right">
						{checkout.total.subtotal.amount}
					</p>
					<p className="text-muted-foreground">Tax:</p>
					<p className="text-muted-foreground text-right">
						{checkout.total.taxExclusive.amount}
					</p>
					<p className="font-bold text-lg">Total:</p>
					<p className="font-bold text-lg font-mono text-right">
						{checkout.total.total.amount}
					</p>
				</div>
			</div>
			<p className="font-bold mb-2">Customer information:</p>
			<Tooltip>
				<TooltipTrigger disabled={!!stripeCustomerId} asChild>
					<div>
						<Label htmlFor="email" className="mb-1">
							Email
						</Label>
						<Input
							id="email"
							{...form.register("email", {
								disabled: !!stripeCustomerId,
							})}
						/>
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom" className="w-fit">
					Currently, the email cannot be changed when using an active Stripe
					customer.
					<br />
					Update the customer's email in the customer's profile.
				</TooltipContent>
			</Tooltip>
			<BillingAddressElement />
			<div>
				<p className="mb-1">Payment</p>
				<PaymentElement
					options={{
						layout: "auto",
					}}
				/>
			</div>
			{rootError && (
				<Alert variant="destructive">
					<AlertTitle className="flex items-center gap-1">
						<AlertCircleIcon className="size-3.5" /> There was a problem
					</AlertTitle>
					<AlertDescription>{rootError}</AlertDescription>
				</Alert>
			)}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
				<ConfirmDialog
					title="Are you sure you want to cancel?"
					description={
						<DialogDescription>
							You can always start a new checkout session later.
						</DialogDescription>
					}
					SecondaryAction={
						<DialogClose asChild>
							<Button variant="secondary">Stay</Button>
						</DialogClose>
					}
					PrimaryAction={
						<Link href={cancelUrl ?? "/admin"}>
							<Button>Cancel and leave</Button>
						</Link>
					}
				>
					<Button variant="secondary" className="w-full">
						Cancel
					</Button>
				</ConfirmDialog>
				<ConfirmDialog
					open={reviewPaymentOpen}
					onOpenChange={setReviewPaymentOpen}
					title="Review and confirm your payment"
					description={
						<DialogDescription asChild>
							<ul className="text-muted-foreground">
								{checkout.lineItems.map((lineItem) => (
									<li
										key={`review-${lineItem.id}`}
										className="flex justify-between items-center"
									>
										<p>
											{lineItem.name} x {lineItem.quantity}
										</p>
										<p className="font-mono">{lineItem.subtotal.amount}</p>
									</li>
								))}
								<li className="flex justify-between items-center text-white font-bold mt-2">
									<p>Total</p>
									<p className="font-mono">{checkout.total.total.amount}</p>
								</li>
							</ul>
						</DialogDescription>
					}
					SecondaryAction={
						<DialogClose asChild>
							<Button variant="secondary">Close and review</Button>
						</DialogClose>
					}
					PrimaryAction={
						<Button disabled={confirming} type="submit" form={formId}>
							Pay {checkout.total.total.amount}
						</Button>
					}
				>
					<Button
						className="w-full"
						disabled={confirming}
						onClick={() => setReviewPaymentOpen(true)}
					>
						{confirming ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							"Pay"
						)}
					</Button>
				</ConfirmDialog>
			</div>
		</form>
	);
};
