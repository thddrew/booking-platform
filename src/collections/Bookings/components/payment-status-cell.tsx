import { ClientField, DefaultServerCellComponentProps } from "payload";
import { PaymentStatusBadge } from "./booking-payment-details";
import Stripe from "stripe";

const PaymentStatusCell = async (
  args: DefaultServerCellComponentProps<
    ClientField,
    Stripe.Checkout.Session.Status
  >
) => {
  return <PaymentStatusBadge status={args.cellData} />;
};

export default PaymentStatusCell;
