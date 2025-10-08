import { novu } from "@/lib/novu/client";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { Customer } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { CollectionAfterChangeHook } from "payload";

export const createSubscriber: CollectionAfterChangeHook<Customer> = async ({
  doc,
  operation,
}) => {
  if (operation === "create") {
    if (!doc.id) {
      console.error("Customer ID is required. Subscriber creation failed.");
      return;
    }

    const tenantId = doc.tenant ? extractID(doc.tenant) : null;

    if (!tenantId) {
      // TODO: handle this case
      console.error("Tenant ID is required. Subscriber creation failed.");
      return;
    }

    await novu.subscribers.create({
      subscriberId: createSubscriberId(tenantId, doc.id),
      email: doc.email,
      phone: doc.phone,
    });
  }
};
