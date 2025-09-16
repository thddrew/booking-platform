/**
 * Note that ALL price amounts are stored in cents in the db but read in dollars here.
 * This is because we have an `afterRead` field hook that converts the cents to dollars.
 */

import type { CollectionAfterChangeHook } from "payload";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import type { Event } from "@/payload-types";
import { debugLog } from "@/utilities/debugLog";
import { extractID } from "@/utilities/extractID";
import { getDefaultConnectedAccount } from "@/utilities/getDefaultConnectedAccount";
import { convertDollarsToCents } from "../utils/convertDollarsToCents";

// TODO: consider sending this to a Job
export const upsertStripeProduct: CollectionAfterChangeHook<Event> = async ({
  doc,
  context,
  req,
  previousDoc,
}) => {
  try {
    if (context?.triggerAfterChange === false) {
      debugLog(
        "Skipping upsertStripeProduct because triggerAfterChange is false"
      );
      return;
    }

    if (doc._status === "draft") {
      debugLog("Skipping upsertStripeProduct because doc is a draft");
      return;
    }

    const defaultConnectedAccount = await getDefaultConnectedAccount();
    const stripeAccountId =
      defaultConnectedAccount?.stripeAccountId ?? undefined;
    const docTenantId = doc.tenant ? extractID(doc.tenant) : null;

    if (!defaultConnectedAccount) {
      console.log(
        "No default connected account found for user when upserting stripe product",
        req.user?.id,
        req.user?.email
      );

      return;
    }

    // Upsert Stripe Product
    let stripeProductId = doc.stripeProductId;

    if (stripeProductId) {
      debugLog("Updating stripe product", stripeProductId);
      // update stripe product
      await stripe.products.update(
        stripeProductId,
        {
          name: doc.title ?? defaultConnectedAccount?.name ?? "N/A",
          active: doc.isActive ?? false,
        },
        {
          stripeAccount: stripeAccountId,
        }
      );
      debugLog("Stripe product updated", stripeProductId);
    } else {
      debugLog("Creating new stripe product");
      // create a new stripe product
      const product = await stripe.products.create(
        {
          name: doc.title ?? defaultConnectedAccount?.name ?? "N/A",
          active: doc.isActive ?? false,
          metadata: {
            event: doc.id,
            tenant: docTenantId,
          },
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      debugLog("New stripe product created", product.id);

      stripeProductId = product.id;

      try {
        debugLog("Updating event with new stripe product id", stripeProductId);

        // https://www.reddit.com/r/PayloadCMS/comments/1bngu3a/comment/n9ld7uw/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
        // Local API requires req to be passed in, otherwise it hangs
        await req.payload.update({
          req,
          id: doc.id,
          collection: "events",
          data: {
            stripeProductId,
          },
          context: {
            triggerAfterChange: false,
          },
        });
        debugLog("Event updated with new stripe product id", stripeProductId);
      } catch (err) {
        // TODO: Log this error to Sentry
        console.error(
          "An error occurred when calling the Stripe API to upsert a product:",
          err
        );
      }
    }

    const previousPricesMap = new Map(
      previousDoc?.prices?.map((price) => [price.id, price])
    );

    debugLog("Creating stripe price promises");
    // Upsert Stripe Prices
    const pricePromises =
      doc.prices?.flatMap((price) => {
        if (price.stripePriceId) {
          // Check if the price has changed
          const previousPriceAmount = previousPricesMap.get(price.id)?.amount;

          const promises: Promise<Stripe.Response<Stripe.Price>>[] = [];
          debugLog(
            "Comparing price amounts",
            previousPriceAmount,
            price.amount
          );
          if (previousPriceAmount !== price.amount) {
            debugLog(
              "Price amounts are different",
              previousPriceAmount,
              price.amount
            );
            // deactive the previous price and create a new one
            debugLog("Deactivating previous price", price.stripePriceId);
            promises.push(
              stripe.prices.update(
                price.stripePriceId,
                {
                  active: false,
                },
                {
                  stripeAccount: stripeAccountId,
                }
              )
            );

            debugLog("Creating new price", price.stripePriceId);
            promises.push(
              stripe.prices.create(
                {
                  product: stripeProductId,
                  currency: "cad", // TODO: make this dynamic
                  active: price.isActive ?? false,
                  unit_amount: convertDollarsToCents(price.amount),
                  nickname: price.label,
                  metadata: {
                    eventId: doc.id,
                    priceId: price.id ?? "",
                    tenantId: docTenantId,
                  },
                },
                {
                  stripeAccount: stripeAccountId,
                }
              )
            );
          } else {
            debugLog(
              "Price amounts are the same",
              previousPriceAmount,
              price.amount
            );
            // update price data excluding the unit_amount
            debugLog("Updating price metadata", price.stripePriceId);
            promises.push(
              stripe.prices.update(
                price.stripePriceId,
                {
                  active: price.isActive ?? false,
                  nickname: price.label,
                },
                {
                  stripeAccount: stripeAccountId,
                }
              )
            );
          }

          return promises;
        } else {
          // this is a new Price object
          debugLog("Creating new price", price.id, price.amount * 100);
          return [
            stripe.prices.create(
              {
                product: stripeProductId,
                currency: "cad", // TODO: make this dynamic
                active: price.isActive ?? false,
                unit_amount: convertDollarsToCents(price.amount),
                nickname: price.label,
                metadata: {
                  eventId: doc.id,
                  priceId: price.id ?? "",
                  tenantId: docTenantId,
                },
              },
              {
                stripeAccount: stripeAccountId,
              }
            ),
          ];
        }
      }) ?? [];

    debugLog("Created stripe price promises", pricePromises.length);

    debugLog("Creating removed prices promises");

    const removedPrices = previousDoc?.prices?.filter(
      (price) => !doc.prices?.some((p) => p.id === price.id)
    );

    removedPrices?.forEach(async (price) => {
      if (price.stripePriceId) {
        pricePromises.push(
          stripe.prices.update(
            price.stripePriceId,
            {
              active: false,
            },
            { stripeAccount: stripeAccountId }
          )
        );
      }
    });

    debugLog("Created removed prices promises", removedPrices?.length);

    debugLog("Updating Stripe prices");
    const updatedPrices = await Promise.all(pricePromises);
    debugLog("Updated Stripe prices", updatedPrices.length);

    const updatedPricesMap = new Map(
      updatedPrices.map((price) => [price.metadata.priceId, price.id])
    );

    const updatedEventPrices = doc.prices?.map((price) => {
      return {
        ...price,
        stripePriceId: price.id ? updatedPricesMap.get(price.id) : undefined,
      };
    });

    debugLog("Updating event with updated prices");
    await req.payload.update({
      req,
      id: doc.id,
      collection: "events",
      data: {
        prices: updatedEventPrices,
      },
      context: {
        triggerAfterChange: false,
      },
    });
  } catch (err) {
    console.error("An error occurred when upserting Stripe product", err);
    // TODO: handle retry logic
  }
};
