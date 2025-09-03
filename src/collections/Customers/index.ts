import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";

export const Customers: CollectionConfig = {
  slug: "customers",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "stripeCustomerId",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
};
