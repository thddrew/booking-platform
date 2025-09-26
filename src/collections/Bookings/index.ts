import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
  CalendarEventSchema,
  type ScheduleInstance,
} from "@/components/calendar/schemas";
import { getDateString } from "../../components/calendar/utils/is-date";
import { EventPricesRecordSchema } from "../Events/utils/schemas";
import { saveSnapshots } from "./hooks/save-snapshots";
import { setDatetimes } from "./hooks/set-datetimes";

export const Bookings: CollectionConfig<"bookings"> = {
  slug: "bookings",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  admin: {
    defaultColumns: ["eventRelation", "dtstart", "dtend"],
  },
  hooks: {
    beforeValidate: [saveSnapshots, setDatetimes],
  },
  fields: [
    {
      type: "group",
      label: "Event & Schedule",
      fields: [
        {
          label: "Event",
          name: "eventRelation",
          type: "relationship",
          relationTo: "events",
          filterOptions: {
            _status: {
              equals: "published",
            },
            isActive: {
              equals: true,
            },
          },
          admin: {
            placeholder:
              "Select an event to view the available time slots. Only published events are available.",
            // TODO: I want to remove the label in the editor but show it in the list column label
            // components: {
            //   Label: "/src/components/blank",
            // },
            allowCreate: false,
          },
        },
        {
          type: "row",
          fields: [
            {
              type: "json",
              name: "selectedScheduleInstanceData",
              admin: {
                components: {
                  Field:
                    "/src/collections/Bookings/components/selected-schedule-instance",
                },
                condition: (_, siblingData) => !!siblingData.eventRelation,
              },
              validate: (value?: ScheduleInstance | null | string) => {
                if (!value || typeof value === "string") return true;

                const parsed = CalendarEventSchema.safeParse({
                  ...value,
                  dtstart: getDateString(value.dtstart),
                  dtend: getDateString(value.dtend),
                });

                return parsed.success ? true : parsed.error.message;
              },
            },
            {
              name: "dtstart",
              label: "Start Date",
              type: "date",
              required: true,
              admin: {
                hidden: true,
              },
            },
            {
              name: "dtend",
              label: "End Date",
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
          type: "relationship",
          relationTo: "customers",
          admin: {
            placeholder:
              "Select an existing customer or press + to create a new customer",
            components: {
              Label: "/src/components/blank",
            },
          },
        },
      ],
    },
    {
      name: "eventSnapshot",
      type: "json",
      defaultValue: {},
      admin: {
        readOnly: true,
      },
    },
    {
      name: "customerSnapshot",
      type: "json",
      defaultValue: {},
      admin: {
        readOnly: true,
      },
    },
    {
      // We don't update this in the hooks because we use this to display the pricing summary in the UI
      name: "pricingSnapshot",
      type: "json",
      defaultValue: {},
      admin: { readOnly: true },
      validate: (value) => {
        if (!value) return true;

        const parsed = EventPricesRecordSchema.safeParse(value);
        return parsed.success ? true : parsed.error.message;
      },
    },
    {
      name: "rrulestring",
      type: "text",
    },
    {
      type: "group",
      admin: {
        position: "sidebar",
      },
      fields: [
        {
          name: "stripeCheckoutSessionId",
          type: "text",
          admin: {
            readOnly: true,
          },
        },
        {
          name: "paymentMethod",
          type: "select",
          options: [
            {
              label: "Pay now",
              value: "payNow",
            },
            {
              label: "Pay later",
              value: "payLater",
            },
          ],
        },
        {
          name: "checkoutForm",
          type: "ui",
          admin: {
            condition: (_, siblingData) =>
              siblingData.paymentMethod === "payNow",
            components: {
              Field:
                "/src/collections/Bookings/components/booking-checkout-form",
            },
          },
        },
      ],
    },
  ],
};
