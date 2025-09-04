import { Button, Gutter, Link, Banner } from "@payloadcms/ui";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import type {
  UIFieldServerProps,
  DefaultServerCellComponentProps,
} from "payload";
import { Suspense } from "react";
import { stripe } from "@/lib/stripe/client";
import { Skeleton } from "@/components/ui/skeleton";

const OnboardStripeAccountCell = async (
  args: DefaultServerCellComponentProps
) => {
  const account = await stripe.accounts.retrieve(args.rowData.stripeAccountId);

  const isOnboarded =
    account.payouts_enabled === true && account.charges_enabled === true;

  return (
    <Suspense fallback={<Skeleton className="h-8 w-full" />}>
      {isOnboarded ? (
        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-1.5 font-medium text-sm">
          <CheckCircle2Icon
            size={16}
            className="text-white"
          />
          Ready
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-md bg-amber-500 text-white px-3 py-1.5 font-medium text-sm">
          <LoaderCircleIcon
            size={16}
            className="text-white"
          />
          Incomplete
        </span>
      )}
    </Suspense>
  );
};

export default OnboardStripeAccountCell;
