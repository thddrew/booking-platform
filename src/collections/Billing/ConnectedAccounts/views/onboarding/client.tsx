"use client";

import { toast } from "@payloadcms/ui";
import { ConnectAccountOnboarding } from "@stripe/react-connect-js";
import { useRouter } from "next/navigation";
import { createStripeOnboardingSession } from "@/lib/stripe/account-sessions";
import StripeConnect from "@/components/stripe-connect";
import { User } from "@/payload-types";

export const OnboardingView = ({
  docId,
  user,
  accountId,
  tenant,
}: {
  docId: number;
  user: User;
  accountId: string;
  tenant: number;
}) => {
  const router = useRouter();

  return (
    <StripeConnect
      fetchClientSecret={async () => {
        console.log("user", user);

        const res = await createStripeOnboardingSession(user, {
          account: accountId,
          tenant,
        });

        return res.clientSecret;
      }}
    >
      <ConnectAccountOnboarding
        onExit={() => {
          toast.success("Stripe account onboarding completed", {
            description: "Your account is now pending approval",
          });
          router.push(`/admin/collections/connectedAccounts/${docId}`);
        }}
      />
    </StripeConnect>
  );
};
