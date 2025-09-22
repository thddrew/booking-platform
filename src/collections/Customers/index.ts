import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import { superAdminOrTenantAdminFieldAccess } from "../Billing/fieldAccess/superAdminOrTenantAdmin";

export const Customers: CollectionConfig<"customers"> = {
  slug: "customers",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  trash: true,
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "bookings",
      type: "join",
      collection: "bookings",
      on: "customerRelation",
    },
    {
      name: "stripeCustomerId",
      type: "text",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      access: {
        read: superAdminOrTenantAdminFieldAccess,
      },
    },
  ],
};
