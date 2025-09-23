import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
  type CalendarEvent,
  CalendarEventSchema,
  ScheduleInstance,
} from "@/components/calendar/schemas";
import { isDate } from "../../components/calendar/utils/is-date";
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
  hooks: {
    beforeValidate: [saveSnapshots, setDatetimes],
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
      defaultValue: {},
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "customerSnapshot",
      type: "json",
      defaultValue: {},
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      // We don't update this in the hooks because we use this to display the pricing summary in the UI
      name: "pricingSnapshot",
      type: "json",
      defaultValue: {},
      admin: { readOnly: true, position: "sidebar" },
      validate: (value) => {
        if (!value) return true;

        const parsed = EventPricesRecordSchema.safeParse(value);

        console.log(parsed.error);

        return parsed.success ? true : parsed.error.message;
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
            components: {
              Label: "/src/components/blank",
            },
            allowCreate: false,
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
                condition: (_, siblingData) => !!siblingData.eventRelation,
              },
              validate: (value?: ScheduleInstance | null | string) => {
                if (!value || typeof value === "string") return true;

                console.log("118", value);

                const parsed = CalendarEventSchema.safeParse({
                  ...value,
                  dtstart: isDate(value.dtstart)
                    ? value.dtstart.toISOString()
                    : value.dtstart,
                  dtend: isDate(value.dtend)
                    ? value.dtend.toISOString()
                    : value.dtend,
                });

                console.log(parsed.error);

                return parsed.success ? true : parsed.error.message;
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
