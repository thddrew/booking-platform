import { novu } from "@/lib/novu/client";
import { Campaign } from "@/payload-types";
import { CollectionAfterDeleteHook } from "payload";

export const deleteCampaign: CollectionAfterDeleteHook<Campaign> = async ({
  doc,
}) => {
  if (!doc.id) {
    console.error("Campaign ID is required. Novu Topic deletion failed.");
    return;
  }

  await novu.topics.delete(doc.id);
};
