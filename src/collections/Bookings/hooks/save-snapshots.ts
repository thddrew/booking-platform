import type { CollectionBeforeChangeHook } from "payload";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

/**
 * Saves the snapshots of the event and customer.
 */
export const saveSnapshots: CollectionBeforeChangeHook<Booking> = async ({
  data,
  req,
  context,
}) => {
  if (context?.triggerAfterChange === false) return data;

  if (!data) return data;

  try {
    await Promise.allSettled([
      data.eventRelation
        ? req.payload
            .findByID({
              req,
              collection: "events",
              id: extractID(data.eventRelation),
              select: {
                bookings: false,
              },
            })
            .then((event) => {
              data.eventSnapshot = JSON.stringify(event);
              return event;
            })
        : Promise.resolve().then(() => {
            data.eventSnapshot = JSON.stringify({});
          }),
      data.customerRelation
        ? req.payload
            .findByID({
              req,
              collection: "customers",
              id: extractID(data.customerRelation),
              select: {
                bookings: false,
                campaign: false,
              },
            })
            .then((customer) => {
              data.customerSnapshot = JSON.stringify(customer);
            })
        : data.customerSnapshot && typeof data.customerSnapshot === "object"
          ? Promise.resolve().then(() => {
              // Guest booking: customerSnapshot is already provided as object
              // Ensure it's a valid object and stringify it
              const customer = data.customerSnapshot as Record<string, unknown>;
              // Remove id if present (guest bookings don't have customer ID)
              const { id: _, ...customerWithoutId } = customer;
              data.customerSnapshot = JSON.stringify(customerWithoutId);
            })
          : Promise.resolve().then(() => {
              data.customerSnapshot = JSON.stringify({});
            }),
    ]);
  } catch (err) {
    console.error(err);
    return data;
  }
};
