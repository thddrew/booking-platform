"use server";

import type { ClientUser } from "payload";
import type Stripe from "stripe";
import { isSuperAdminOrTenantAdmin } from "@/access/isSuperAdminOrTenantAdmin";
import { stripe } from "@/lib/stripe/client";
import type { User } from "@/payload-types";

export type CreateStripeAccountSession = (
  user: ClientUser | User | null | undefined,
  {
    account,
    tenant,
    ...params
  }: {
    account: string;
    tenant: number;
  } & Partial<Stripe.AccountSessionCreateParams>
) => Promise<{ clientSecret: string }>;

export const createStripeAccountSession: CreateStripeAccountSession = async (
  user,
  { account, tenant, ...params }
) => {
  if (!user || !isSuperAdminOrTenantAdmin(user, tenant)) {
    throw new Error(
      "You are not authorized to manage this tenant's Stripe account"
    );
  }

  if (!account) {
    throw new Error("Stripe account ID is required");
  }

  try {
    const accountSession = await stripe.accountSessions.create({
      ...params,
      account,
      components: params.components ?? {},
    });

    return {
      clientSecret: accountSession.client_secret,
    };
  } catch (err: any) {
    throw new Error(`Failed to create account session: ${err.message}`);
  }
};

export const createStripeOnboardingSession: CreateStripeAccountSession = async (
  user,
  { account, tenant, ...params }
) => {
  return createStripeAccountSession(user, {
    account,
    tenant,
    components: {
      ...params.components,
      account_onboarding: { enabled: true },
    },
    ...params,
  });
};

export const createStripeDashboardSession: CreateStripeAccountSession = async (
  user,
  { account, tenant, ...params }
) => {
  return createStripeAccountSession(user, {
    account,
    tenant,
    components: {
      payments: { enabled: true },
      payment_details: { enabled: true },
    },
    ...params,
  });
};

export const createStripeNotificationBannerSession: CreateStripeAccountSession =
  async (user, { account, tenant, ...params }) => {
    return createStripeAccountSession(user, {
      account,
      tenant,
      components: {
        notification_banner: { enabled: true },
      },
      ...params,
    });
  };
