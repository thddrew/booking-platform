import type { CollectionBeforeValidateHook } from "payload";
import type { Booking } from "@/payload-types";
import { extractID } from "@/utilities/extractID";

export const saveSnapshots: CollectionBeforeValidateHook<Booking> = async ({
  data,
  req,
}) => {
  if (!data) return data;

  await Promise.all([
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
          })
      : Promise.resolve(null),
    data.customerRelation
      ? req.payload
          .findByID({
            req,
            collection: "customers",
            id: extractID(data.customerRelation),
            select: {
              bookings: false,
            },
          })
          .then((customer) => {
            data.customerSnapshot = JSON.stringify(customer);
          })
      : Promise.resolve(null),
  ]);

  return data;
};
