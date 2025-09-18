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
    // Metadata for sidebar
    {
      name: "stripeCheckoutSessionId",
      type: "text",
      // TODO: does this need to be required?
      required: false,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "eventId",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "customerId",
      type: "text",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "eventSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "customerSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "pricingSnapshot",
      type: "json",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      type: "group",
      label: "Event",
      fields: [
        {
          name: "eventRelation",
          type: "relationship",
          relationTo: "events",
          admin: {
            components: {
              Label: "/src/components/blank",
            },
          },
        },
        {
          name: "dtstart",
          type: "date",
          required: true,
          admin: {
            hidden: true,
          },
        },
        {
          name: "dtend",
          type: "date",
          required: true,
          admin: {
            hidden: true,
          },
        },
        {
          type: "ui",
          name: "eventCalendars",
          admin: {
            components: {
              Field: "/src/collections/Booking/components/eventCalendars",
            },
          },
        },
      ],
    },
    {
      type: "group",
      label: "Customer",
      fields: [
        {
          name: "customerRelation",
          label: "Customer",
          type: "relationship",
          relationTo: "customers",
        },
      ],
    },
    {
      name: "rrulestring",
      type: "text",
      admin: {
        position: "sidebar",
      },
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
  ],
};
