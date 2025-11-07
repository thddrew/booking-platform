import type Stripe from "stripe";
import type { Badge } from "@/components/ui/badge";

/**
 * We use this to temporarily set the payment status in the db while we await the webhook
 * Eventually, the status in the db will be set to the actual status from the webhook Stripe.PaymentIntent.Status
 */
export const PAYMENT_STATUS = {
	processing: "processing",
} as const;

export type Status = Stripe.Checkout.Session.Status | "refunded";

export const mapStatusToVariant: Partial<
	Record<Status, Parameters<typeof Badge>[0]["variant"]>
> = {
	complete: "success",
	expired: "destructive",
	open: "warning",
	refunded: "secondary",
};
