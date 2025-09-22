import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
  type CalendarEvent,
  CalendarEventSchema,
} from "@/components/calendar/schemas";
import { EventPricesRecordSchema } from "../Events/utils/schemas";

export const Bookings: CollectionConfig<"bookings"> = {
  slug: "bookings",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  hooks: {
    // TODO: update eventSnapshot and customerSnapshot on beforeChange
  },
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
      defaultValue: {},
      admin: { readOnly: true, position: "sidebar" },
      validate: (value) => {
        if (!value) return true;

        return EventPricesRecordSchema.safeParse(value).success
          ? true
          : "Invalid pricing snapshot";
      },
    },
    {
      type: "group",
      label: "Event & Schedule",
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
                    "/src/collections/Bookings/components/selected-schedule-instance",
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
              Field: "/src/collections/Bookings/components/events-calendar",
            },
            condition: (_, siblingData) => siblingData.eventRelation,
          },
        },
      ],
    },
    {
      type: "group",
      label: "Attendees & Pricing",
      fields: [
        {
          type: "checkbox",
          name: "overrideMaxQuantity",
          label: "Override maximum event attendance",
          admin: {
            disabled: true,
            condition: (_, siblingData) =>
              siblingData.eventRelation &&
              siblingData.selectedScheduleInstanceData,
          },
        },
        {
          type: "ui",
          name: "attendees",
          admin: {
            components: {
              Field: "/src/collections/Bookings/components/configure-attendees",
            },
          },
        },
        {
          type: "ui",
          name: "pricingSummary",
          admin: {
            components: {
              Field: "/src/collections/Bookings/components/pricing-summary",
            },
            condition: (_, siblingData) =>
              siblingData.eventRelation &&
              siblingData.selectedScheduleInstanceData,
          },
        },
      ],
    },
    {
      type: "group",
      label: "Customer Information",
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
