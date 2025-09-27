import type { UIFieldServerComponent } from "payload";
import { EventPricesRecordSchema } from "@/collections/Events/utils/schemas";
import { CheckoutForm } from "@/components/stripe-checkout/checkout-form";
import { CheckoutProviderServer } from "@/components/stripe-checkout/checkout-provider";
import { convertPricingSnapshotToLineItems } from "@/components/stripe-checkout/utils";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";
import { TypedFieldComponent } from "@/types/custom";
import { Booking } from "@/payload-types";
import { CustomerSchema } from "@/collections/Customers/utils/schemas";

const BookingCheckoutForm: TypedFieldComponent<
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

  const stripeAccountId = stripeAccount?.stripeAccountId ?? undefined;

  return (
    <CheckoutProviderServer
      lineItems={lineItems}
      customerId={stripeCustomerId}
      stripeAccountId={stripeAccountId}
    >
      <CheckoutForm
        // TODO: I don't like having to pass this down in AGAIN
        stripeAccountId={stripeAccountId}
        email={customer.success ? customer.data.email : undefined}
        isStripeCustomer={!!stripeCustomerId}
      />
    </CheckoutProviderServer>
  );
};

export default BookingCheckoutForm;
