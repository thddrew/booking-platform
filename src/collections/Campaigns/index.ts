import { CollectionConfig } from "payload";
import { createCampaign } from "./hooks/create-campaign";
import { deleteCampaign } from "./hooks/delete-campaign";

export const Campaigns: CollectionConfig<"campaigns"> = {
  slug: "campaigns",
  versions: true,
  trash: true,
  hooks: {
    afterChange: [createCampaign],
    afterDelete: [deleteCampaign],
  },
  fields: [
    {
      type: "text",
      name: "Campaign Name",
      required: true,
    },
    {
      type: "text",
      name: "Description",
    },
    {
      type: "relationship",
      name: "subscribers",
      relationTo: "customers",
      hasMany: true,
      admin: {
        description:
          "These are the customers who will receive the campaign emails",
      },
    },
  ],
};
