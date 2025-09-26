import type { UIFieldServerComponent } from "payload";
import { EventPricesRecordSchema } from "@/collections/Events/utils/schemas";
import { CheckoutForm } from "@/components/stripe-checkout/checkout-form";
import { CheckoutProviderServer } from "@/components/stripe-checkout/checkout-provider";
import { convertPricingSnapshotToLineItems } from "@/components/stripe-checkout/utils";
import { getTenantDefaultConnectedAccount } from "@/utilities/getTenantDefaultConnectedAccount";
import { TypedFieldComponent } from "@/types/custom";
import { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { isCollectionObject } from "@/utilities/isCollectionObject";

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
  const customer = args.data.customerRelation;

  console.log("customer", customer);

  return (
    <CheckoutProviderServer
      lineItems={lineItems}
      customerId={
        isCollectionObject(customer) ? customer.stripeCustomerId : undefined
      }
      stripeAccount={stripeAccount?.stripeAccountId ?? undefined}
    >
      <CheckoutForm />
    </CheckoutProviderServer>
  );
};

export default BookingCheckoutForm;
