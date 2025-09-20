import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
  type CalendarEvent,
  CalendarEventSchema,
} from "@/components/calendar/types";
import { EventPricesArraySchema } from "../Events/utils/zod";

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
        position: "sidebar",
      },
    },
    {
      name: "customerSnapshot",
      type: "json",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "pricingSnapshot",
      type: "json",
      admin: {
        position: "sidebar",
      },
      validate: (value) => {
        if (!value) return true;

        return EventPricesArraySchema.safeParse(value).success
          ? true
          : "Invalid pricing snapshot";
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
          type: "row",
          fields: [
            {
              type: "json",
              name: "selectedScheduleInstanceData",
              virtual: true,
              admin: {
                components: {
                  Field:
                    "/src/collections/Bookings/components/selectedScheduleInstance",
                },
              },
              validate: (value?: CalendarEvent | null | string) => {
                if (!value) return true;

                return CalendarEventSchema.safeParse(value).success
                  ? true
                  : "Invalid schedule instance";
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
          ],
        },
        {
          type: "ui",
          name: "eventCalendars",
          admin: {
            components: {
              Field: "/src/collections/Bookings/components/eventCalendars",
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
