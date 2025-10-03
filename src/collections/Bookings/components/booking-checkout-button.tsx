import { stringify, parse } from "qs-esm";
import type { UIFieldServerComponent } from "payload";
import { EventPricesRecordSchema } from "@/collections/Events/utils/schemas";
import { CheckoutForm } from "@/components/stripe-checkout/checkout-form";
import {
  CheckoutContextType,
  CheckoutProvider,
} from "@/components/stripe-checkout/checkout-provider";
import { convertPricingSnapshotToLineItems } from "@/components/stripe-checkout/utils";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";
import { TypedFieldComponent } from "@/types/custom";
import { Booking } from "@/payload-types";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCardIcon } from "lucide-react";
import { headers } from "next/headers";
import { extractID } from "@/utilities/extractID";

const BookingCheckoutButton: TypedFieldComponent<
  UIFieldServerComponent,
  Booking
> = async (args) => {
  const pricingSnapshot = EventPricesRecordSchema.safeParse(
    args.data.pricingSnapshot
  );

  if (!pricingSnapshot.success)
    return <div>TODO: handle invalid pricing snapshot</div>;

  const lineItems = convertPricingSnapshotToLineItems(pricingSnapshot.data);
  const stripeAccount = await getTenantDefaultConnectedAccount();
  const customer = CustomerSchema.safeParse(args.data.customerSnapshot);

  const stripeCustomerId = customer.success
    ? customer.data.stripeCustomerId
    : undefined;

  const stripeCustomerEmail = customer.success
    ? customer.data.email
    : undefined;

  const stripeAccountId = stripeAccount?.stripeAccountId ?? undefined;
  const bookingId = args.data.id;

  const checkoutSuccessReturnUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL}/admin/checkout/success?bookingId=${bookingId}&checkoutSessionId={CHECKOUT_SESSION_ID}`;
  const checkoutCancelUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/bookings/${bookingId}`;

  const query = stringify({
    items: lineItems,
    stCusId: stripeCustomerId,
    stAccId: stripeAccountId,
    stCusEmail: stripeCustomerEmail,
    tenantId: stripeAccount?.tenant ? extractID(stripeAccount?.tenant) : "",
    bookingId,
    returnUrl: checkoutSuccessReturnUrl,
    cancelUrl: checkoutCancelUrl,
  } satisfies CheckoutContextType);

  return (
    <div className="twp my-6">
      <Link href={`/admin/checkout?${query}`}>
        <Button className="w-full">
          Proceed to pay <CreditCardIcon />
        </Button>
      </Link>
    </div>
  );
};

export default BookingCheckoutButton;
