"use client";

import { CheckoutProvider, PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useStripeAppearance } from "@/hooks/use-stripe-appearance";
import { createPaymentCheckoutSession } from "./payment-actions";
import { loadAccountStripe } from "@/lib/stripe/load-account-stripe";

interface PaymentCheckoutProps {
	bookingId: string;
	tenantId: string;
	stripeAccountId: string;
	customerEmail: string;
	pricingSnapshot: Record<string, unknown>;
	successUrl: string;
	cancelUrl: string;
}

function PaymentForm({ successUrl }: { successUrl: string }) {
	const router = useRouter();
	const checkout = useCheckout();
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsProcessing(true);
		setError(null);

		try {
			const result = await checkout.confirm();

			if (result.type === "error") {
				setError(result.error.message || "Payment failed");
				setIsProcessing(false);
			} else {
				// Payment successful - redirect to success page
				router.push(successUrl);
			}
		} catch (err) {
			console.error("Payment error:", err);
			setError(err instanceof Error ? err.message : "Payment failed");
			setIsProcessing(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<PaymentElement />

			{error && (
				<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			<Button
				type="submit"
				size="lg"
				className="w-full"
				disabled={isProcessing}
			>
				{isProcessing ? (
					<>
						<Loader2Icon className="h-4 w-4 animate-spin mr-2" />
						Processing...
					</>
				) : (
					"Pay Now"
				)}
			</Button>
		</form>
	);
}

export function PaymentCheckout({
	bookingId,
	tenantId,
	stripeAccountId,
	customerEmail,
	pricingSnapshot,
	successUrl,
	cancelUrl,
}: PaymentCheckoutProps) {
	const appearance = useStripeAppearance();

	const stripePromise = useMemo(() => {
		return loadAccountStripe(stripeAccountId);
	}, [stripeAccountId]);

	const clientSecretPromise = useMemo(() => {
		return createPaymentCheckoutSession({
			bookingId,
			tenantId,
			stripeAccountId,
			customerEmail,
			pricingSnapshot,
			successUrl,
		});
	}, [bookingId, tenantId, stripeAccountId, customerEmail, pricingSnapshot, successUrl]);

	return (
		<CheckoutProvider
			stripe={stripePromise}
			options={{
				clientSecret: clientSecretPromise,
				elementsOptions: {
					appearance,
				},
			}}
		>
			<PaymentForm successUrl={successUrl} />
		</CheckoutProvider>
	);
}
