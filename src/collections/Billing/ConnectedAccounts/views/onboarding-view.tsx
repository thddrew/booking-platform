"use client";

import { toast, useAuth, useDocumentInfo } from "@payloadcms/ui";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createStripeOnboardingSession } from "@/lib/stripe/account-sessions";
import { DocumentViewClientProps } from "payload";

export const OnboardingView = (args: DocumentViewClientProps) => {
  const { id, data } = useDocumentInfo();
  const { fetchFullUser } = useAuth();
  const router = useRouter();
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);

  useEffect(() => {
    if (data?.stripeAccountId) {
      setInstance(
        loadConnectAndInitialize({
          fetchClientSecret: async () => {
            const user = await fetchFullUser();

            const res = await createStripeOnboardingSession(user, {
              account: data.stripeAccountId,
              tenant: data.tenant,
            });

            return res.clientSecret;
          },
          publishableKey: process.env
            .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
          appearance: {
            overlays: "drawer",
          },
        })
      );
    }
  }, [data?.stripeAccountId]);

  if (!instance) {
    return null;
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      <ConnectAccountOnboarding
        onExit={() => {
          toast.success("Stripe account onboarding completed", {
            description: "Your account is now pending approval",
          });
          router.push(`/admin/collections/connectedAccounts/${id}`);
        }}
      />
    </ConnectComponentsProvider>
  );
};

export default OnboardingView;
