import type { UIFieldServerComponent } from "payload";
import { EventPricesRecordSchema } from "@/collections/Events/utils/schemas";
import { CheckoutForm } from "@/components/stripe-checkout/checkout-form";
import { CheckoutProviderServer } from "@/components/stripe-checkout/checkout-provider";
import { convertPricingSnapshotToLineItems } from "@/components/stripe-checkout/utils";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";

const BookingCheckoutForm: UIFieldServerComponent = async (args) => {
  const pricingSnapshot = EventPricesRecordSchema.safeParse(
    args.data.pricingSnapshot
  );

  if (!pricingSnapshot.success)
    return <div>TODO: handle invalid pricing snapshot</div>;

  const lineItems = convertPricingSnapshotToLineItems(pricingSnapshot.data);

  const stripeAccount = await getTenantDefaultConnectedAccount();

  return (
    <CheckoutProviderServer
      lineItems={lineItems}
      customerId={args.data.customerRelation?.id}
      stripeAccount={stripeAccount?.stripeAccountId ?? undefined}
    >
      <CheckoutForm />
    </CheckoutProviderServer>
  );
};

export default BookingCheckoutForm;
