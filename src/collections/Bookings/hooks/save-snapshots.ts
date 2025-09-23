import type { CollectionBeforeValidateHook } from "payload";
import type { Booking } from "@/payload-types";

export const saveSnapshots: CollectionBeforeValidateHook<Booking> = async ({
  data,
  req,
}) => {
  if (!data) return data;

  console.log("data", data);

  const event = await req.payload.find({
    collection: "events",
    where: {
      id: { equals: data.eventRelation },
    },
    depth: 1,
  });

  console.log("event", event);

  data.eventSnapshot = JSON.stringify(event);
  data.customerSnapshot = JSON.stringify(data.customerRelation);
  return data;
};
