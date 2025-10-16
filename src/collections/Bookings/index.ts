import type {
  CollectionConfig,
  FieldHook,
  FieldHookArgs,
  RelationshipValue,
} from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
  CalendarEventSchema,
  type ScheduleInstance,
} from "@/components/calendar/schemas";
import { getDateString } from "../../components/calendar/utils/is-date";
import { EventPricesRecordSchema } from "../Events/utils/schemas";
import { saveSnapshots } from "./hooks/save-snapshots";
import { setDatetimes } from "./hooks/set-datetimes";
import { updateAccess } from "./access/update-access";
import {
  BOOKING_CANCELLED,
  BOOKING_CONFIRMATION,
  BOOKING_UPDATED,
} from "../Emails/utils/email-types";
import { newBookingEmail } from "./hooks/new-booking-email";

export const Bookings: CollectionConfig<"bookings"> = {
  slug: "bookings",
  trash: true,
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: updateAccess,
  },
  admin: {
    defaultColumns: ["eventRelation", "dtstart", "dtend", "paymentStatus"],
  },
  hooks: {
    beforeValidate: [saveSnapshots, setDatetimes],
    afterChange: [newBookingEmail],
  },
  versions: true,
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
      admin: {
        readOnly: true,
        hidden: true,
      },
      fields: [
        {
          name: "eventSnapshot",
          type: "json",
          defaultValue: {},
        },
        {
          name: "customerSnapshot",
          type: "json",
          defaultValue: {},
        },
        {
          // We don't update this in the hooks because we use this to display the pricing summary in the UI
          name: "pricingSnapshot",
          type: "json",
          defaultValue: {},
          validate: (value) => {
            if (!value) return true;

            const parsed = EventPricesRecordSchema.safeParse(value);
            return parsed.success ? true : parsed.error.message;
          },
        },
      ],
    },
    {
      name: "rrulestring",
      type: "text",
      admin: {
        hidden: true,
      },
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
            hidden: true,
          },
        },
        {
          // TODO: show badge field component
          name: "paymentStatus",
          type: "text",
          admin: {
            readOnly: true,
            components: {
              Cell: "/src/collections/Bookings/components/payment-status-cell",
            },
          },
        },
        {
          type: "ui",
          name: "paymentDetails",
          admin: {
            components: {
              Field:
                "/src/collections/Bookings/components/booking-payment-details",
            },
          },
        },
        {
          name: "paymentMethod",
          type: "select",
          admin: {
            condition: (_, siblingData) => !siblingData.stripeCheckoutSessionId,
          },
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
              siblingData.paymentMethod === "payNow" &&
              !siblingData.stripeCheckoutSessionId,
            components: {
              Field:
                "/src/collections/Bookings/components/booking-checkout-button",
            },
          },
        },
      ],
    },
    {
      type: "group",
      admin: {
        position: "sidebar",
      },
      fields: [
        {
          name: "bookingConfirmationEmail",
          type: "relationship",
          relationTo: "emails",
          admin: {
            components: {
              Description: {
                path: "/src/collections/Bookings/components/email-description",
                clientProps: {
                  errorMessage:
                    "No email is selected. The user will not receive a confirmation email.",
                },
              },
            },
          },
          defaultValue: async ({ req }) => {
            const emails = await req.payload.find({
              collection: "emails",
              where: {
                emailType: {
                  equals: BOOKING_CONFIRMATION,
                },
              },
            });

            return emails.docs[0]?.id;
          },
        },
        {
          name: "bookingCancelledEmail",
          type: "relationship",
          relationTo: "emails",
          admin: {
            components: {
              Description: {
                path: "/src/collections/Bookings/components/email-description",
                clientProps: {
                  errorMessage:
                    "No email is selected. The user will not receive a cancellation email.",
                },
              },
            },
          },
          defaultValue: async ({ req }) => {
            const emails = await req.payload.find({
              collection: "emails",
              where: {
                emailType: {
                  equals: BOOKING_CANCELLED,
                },
              },
            });

            return emails.docs[0]?.id;
          },
        },
        {
          name: "bookingUpdatedEmail",
          type: "relationship",
          relationTo: "emails",
          admin: {
            components: {
              Description: {
                path: "/src/collections/Bookings/components/email-description",
                clientProps: {
                  errorMessage:
                    "No email is selected. The user will not receive an updated email.",
                },
              },
            },
          },
          defaultValue: async ({ req }) => {
            const emails = await req.payload.find({
              collection: "emails",
              where: {
                emailType: {
                  equals: BOOKING_UPDATED,
                },
              },
            });

            return emails.docs[0]?.id;
          },
        },
      ],
    },
  ],
};
