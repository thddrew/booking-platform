import { ExternalLinkIcon } from "@payloadcms/ui";
import { formatRelative } from "date-fns";
import {
	CalendarDaysIcon,
	CircleDollarSignIcon,
	CircleSmallIcon,
	CreditCardIcon,
} from "lucide-react";
import type { ServerFieldBase, UIFieldClient } from "payload";
import type Stripe from "stripe";
import { convertCentsToDollars } from "@/collections/Events/utils/convertCentsToDollars";
import { formatCurrency } from "@/collections/Events/utils/format-currency";
import { formatDate } from "@/components/calendar/utils/format-date";
import { ConnectPaymentDetails } from "@/components/stripe-connect/connect-payment-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDefaultAccountStripeClient } from "@/lib/stripe/get-account-stripe";
import { getCheckoutSessionStatus } from "@/lib/stripe/get-checkout-session-status";
import type { Booking } from "@/payload-types";
import type { TypedFieldComponent } from "@/types/custom";
import { extractID } from "@/utilities/extractID";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";

type Status = Stripe.Checkout.Session.Status | "refunded";

const mapStatusToVariant: Partial<
	Record<Status, Parameters<typeof Badge>[0]["variant"]>
> = {
	complete: "success",
	expired: "destructive",
	open: "warning",
	refunded: "secondary",
};

export const PaymentStatusBadge = ({ status }: { status: Status | null }) => {
	const statusLabel = status?.replaceAll("_", " ").toLowerCase();
	return (
		<Badge
			variant={status ? mapStatusToVariant[status] : "default"}
			className="first-letter:capitalize block text-sm text-center"
		>
			{statusLabel}
		</Badge>
	);
};

export const BookingPaymentDetails: TypedFieldComponent<
	ServerFieldBase<UIFieldClient>,
	Booking
> = async ({ data, user }) => {
	const { stripeCheckoutSessionId } = data;

	if (!stripeCheckoutSessionId) return null;

	const account = await getTenantDefaultConnectedAccount();
	const stripe = await getDefaultAccountStripeClient();

	const checkoutSession = await stripe.checkout.sessions.retrieve(
		stripeCheckoutSessionId,
		{
			expand: ["payment_intent.latest_charge"],
		},
	);

	const checkoutStatus = getCheckoutSessionStatus(checkoutSession);

	if (!checkoutStatus.status) return null;

	const { latestCharge } = checkoutStatus;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Payment details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<ul className="space-y-2">
					<li className="grid grid-cols-[100px_1fr] gap-2 items-center">
						<span className="flex items-center gap-1">
							<CircleSmallIcon className="size-4" strokeWidth={1.5} />
							Status:
						</span>
						<PaymentStatusBadge status={checkoutSession.status} />
					</li>
					<li className="grid grid-cols-[100px_1fr] gap-2 items-center">
						<span className="flex items-center gap-1">
							<CalendarDaysIcon className="size-4" strokeWidth={1.5} />
							Paid on:
						</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="first-letter:capitalize">
									{latestCharge?.created
										? formatRelative(
												new Date(latestCharge?.created * 1000),
												new Date(),
											)
										: "-"}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{latestCharge?.created
									? formatDate(new Date(latestCharge?.created * 1000))
									: "-"}
							</TooltipContent>
						</Tooltip>
					</li>
					<li className="grid grid-cols-[100px_1fr] gap-2 items-center">
						<span className="flex items-center gap-1">
							<CircleDollarSignIcon className="size-4" strokeWidth={1.5} />
							Amount:
						</span>
						<span className="font-mono">
							{formatCurrency(
								convertCentsToDollars(latestCharge?.amount),
								latestCharge?.currency?.toUpperCase(),
							)}
						</span>
					</li>
					{latestCharge?.payment_method_details?.type === "card" && (
						<li className="grid grid-cols-[100px_1fr] gap-2 items-center">
							<span className="flex items-center gap-1">
								<CreditCardIcon className="size-4" strokeWidth={1.5} />
								Paid with:
							</span>
							<span>
								**{latestCharge?.payment_method_details?.card?.last4}{" "}
								{latestCharge?.payment_method_details?.card?.brand?.toUpperCase()}
							</span>
						</li>
					)}
				</ul>
				<Separator />
				<ConnectPaymentDetails
					user={user}
					accountId={account?.stripeAccountId ?? ""}
					tenant={account?.tenant ? extractID(account?.tenant) : ""}
					chargeId={latestCharge?.id}
				>
					<Button variant="ghost">
						View additional details or begin refund <ExternalLinkIcon />
					</Button>
				</ConnectPaymentDetails>
			</CardContent>
		</Card>
	);
};

export default BookingPaymentDetails;
