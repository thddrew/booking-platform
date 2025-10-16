import type { ClientField, DefaultServerCellComponentProps } from "payload";
import type Stripe from "stripe";
import { PaymentStatusBadge } from "./booking-payment-details";

const PaymentStatusCell = async (
	args: DefaultServerCellComponentProps<
		ClientField,
		Stripe.Checkout.Session.Status
	>,
) => {
	if (!args.cellData) return <div>-</div>;
	return <PaymentStatusBadge status={args.cellData} />;
};

export default PaymentStatusCell;
