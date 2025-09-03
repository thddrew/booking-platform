import { CollectionConfig } from "payload";

export const Payments: CollectionConfig<"payments"> = {
  slug: "payments",
  admin: {
    group: "Billing",
    components: {
      views: {
        list: {
          Component: "/src/collections/Billing/Payments/views/list-view",
        },
      },
    },
  },
  fields: [],
};
