import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";

export const Bookings: CollectionConfig<"bookings"> = {
  slug: "bookings",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {},
  fields: [
    {
      name: "stripeCheckoutSessionId",
      type: "text",
      // TODO: does this need to be required?
      required: false,
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: "eventId",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "eventRelation",
      label: "Event",
      type: "relationship",
      relationTo: "events",
    },
    {
      name: "customerId",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "customerRelation",
      label: "Customer",
      type: "relationship",
      relationTo: "customers",
    },
    {
      name: "dtstart",
      type: "date",
      required: true,
    },
    {
      name: "dtend",
      type: "date",
      required: true,
    },
    {
      name: "rrulestring",
      type: "text",
    },
    {
      name: "paymentMethod",
      type: "select",
      options: [
        {
          label: "Stripe",
          value: "stripe",
        },
        {
          label: "In Person",
          value: "inPerson",
        },
      ],
    },
    {
      name: "eventSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: "customerSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: "pricingSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
  ],
};
