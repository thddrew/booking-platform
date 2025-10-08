import { novu } from "@/lib/novu/client";
import { createSubscriberId } from "@/lib/novu/create-subscriber-id";
import { Customer } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { CollectionAfterDeleteHook } from "payload";

export const deleteSubscriber: CollectionAfterDeleteHook<Customer> = async ({
  doc,
}) => {
  if (!doc.id) {
    console.error("Customer ID is required. Subscriber creation failed.");
    return;
  }

  const tenantId = doc.tenant ? extractID(doc.tenant) : null;

  if (!tenantId) {
    // TODO: handle this case
    console.error("Tenant ID is required. Subscriber deletion failed.");
    return;
  }

  await novu.subscribers.delete(createSubscriberId(tenantId, doc.id));
};
