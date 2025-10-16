"use client";

import { toast } from "@payloadcms/ui";
import { Slot } from "@radix-ui/react-slot";
import { ConnectPaymentDetails as ConnectPaymentDetailsComponent } from "@stripe/react-connect-js";
import type { ClientUser } from "payload";
import { useState } from "react";
import { createStripeAccountSession } from "@/lib/stripe/create-account-sessions";
import type { User } from "@/payload-types";
import StripeConnect from "../stripe-connect";
import { Alert, AlertTitle } from "../ui/alert";

export const ConnectPaymentDetails = ({
	user,
	accountId,
	tenant,
	chargeId,
	children,
	open,
	onClose,
}: {
	user: ClientUser | User;
	accountId?: string | null;
	tenant?: string | null;
	chargeId?: string | null;
	children?: React.ReactNode;
	open?: boolean;
	onClose?: () => void;
}) => {
	const [innerOpen, setInnerOpen] = useState(open);

	const isOpen = open ?? innerOpen;

	if (!accountId || !tenant || !chargeId) {
		const message = !accountId
			? "No account found"
			: !tenant
				? "No tenant found"
				: "No charge found";

		return (
			<Alert>
				<AlertTitle>{message}</AlertTitle>
			</Alert>
		);
	}

	return (
		<StripeConnect
			fetchClientSecret={async () => {
				const res = await createStripeAccountSession(user, {
					account: accountId,
					tenant,
					components: {
						payment_details: {
							enabled: true,
						},
					},
				});

				return res.clientSecret;
			}}
		>
			<div>
				{children ? (
					<Slot onClick={() => setInnerOpen(true)}>{children}</Slot>
				) : null}
				{isOpen ? (
					<ConnectPaymentDetailsComponent
						payment={chargeId}
						onClose={() => {
							setInnerOpen(false);
							onClose?.();
						}}
						onLoadError={(e) => {
							console.error(e);
							toast.error("Failed to load Stripe payments");
						}}
					/>
				) : null}
			</div>
		</StripeConnect>
	);
};
