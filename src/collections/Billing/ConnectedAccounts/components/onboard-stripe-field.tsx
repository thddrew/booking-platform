import { Button, Gutter, Link, Banner } from "@payloadcms/ui";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import type { UIFieldServerProps } from "payload";
import { Suspense } from "react";
import { stripe } from "@/lib/stripe/client";
import { Skeleton } from "@/components/ui/skeleton";

const OnboardStripeAccountLink = (args: UIFieldServerProps) => {
  return (
    <Link
      href={`/admin/collections/connectedAccounts/${args.id}/onboard-stripe`}
    >
      <Button>Onboard Stripe Account</Button>
    </Link>
  );
};

const OnboardStripeAccountData = async (args: UIFieldServerProps) => {
  const account = await stripe.accounts.retrieve(args.data.stripeAccountId);

  const isOnboarded =
    account.payouts_enabled === true && account.charges_enabled === true;

  return (
    <Suspense fallback={<Skeleton className="h-8 w-full" />}>
      {isOnboarded ? (
        <Banner
          alignIcon="left"
          icon={<CheckCircle2Icon size={16} />}
          type="success"
          className="items-center gap-1"
        >
          Your account is onboarded and ready to receive payments!
        </Banner>
      ) : (
        <OnboardStripeAccountLink {...args} />
      )}
    </Suspense>
  );
};

export default OnboardStripeAccountData;
