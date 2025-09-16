import type { CollectionConfig } from "payload";
import { superAdminFieldAccess } from "@/access/superAdminFieldAccess";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import { convertAmountToDataType } from "./hooks/convertAmountToDataType";
import { convertAmountToDisplayType } from "./hooks/convertAmountToDisplayType";
import { generateRrulestring } from "./hooks/generateRrulestring";
import { upsertStripeProduct } from "./hooks/upsertStripeProduct";

export const Events: CollectionConfig<"events"> = {
  slug: "events",
  trash: true,
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  versions: true,
  admin: {
    useAsTitle: "title",
  },
  hooks: {
    beforeChange: [generateRrulestring],
    afterChange: [upsertStripeProduct],
  },
  fields: [
    {
      type: "checkbox",
      name: "isActive",
      label: "Active",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Turning this off will hide the event from the public",
      },
    },
    {
      type: "text",
      name: "stripeProductId",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Description",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Title",
              required: true,
            },
            {
              name: "description",
              type: "richText",
              label: "Description",
            },
          ],
        },
        {
          label: "Schedules",
          name: "schedules",
          admin: {
            description: "Create one or more schedules for the event",
          },
          fields: [
            {
              type: "array",
              name: "schedule",
              admin: {
                components: {
                  RowLabel: "/src/collections/Events/components/RowLabel",
                },
              },
              fields: [
                {
                  type: "checkbox",
                  name: "isActive",
                  label: "Active",
                  defaultValue: true,
                },
                {
                  type: "text",
                  name: "scheduleName",
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "dtstart",
                      type: "date",
                      label: "Start Time",
                      required: true,
                      admin: {
                        date: {
                          pickerAppearance: "dayAndTime",
                        },
                      },
                    },
                    {
                      name: "dtend",
                      type: "date",
                      label: "End Time",
                      required: true,
                      admin: {
                        date: {
                          pickerAppearance: "dayAndTime",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "checkbox",
                  name: "isRecurring",
                  label: "This is a recurring event",
                  defaultValue: true,
                },
                {
                  type: "row",
                  admin: {
                    condition: (_, siblingData) => siblingData.isRecurring,
                  },
                  fields: [
                    {
                      type: "number",
                      virtual: true,
                      name: "interval",
                      label: "Repeat every...",
                      defaultValue: 1,
                      admin: {
                        step: 1,
                        width: "33%",
                      },
                    },
                    {
                      type: "select",
                      virtual: true,
                      name: "frequency",
                      admin: {
                        components: {
                          Label: "/src/components/blank",
                        },
                        width: "33%",
                      },
                      defaultValue: "WEEKLY",
                      options: [
                        { label: "Day", value: "DAILY" },
                        { label: "Week", value: "WEEKLY" },
                        { label: "Month", value: "MONTHLY" },
                        { label: "Year", value: "YEARLY" },
                      ],
                    },
                  ],
                },
                {
                  type: "row",
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData.frequency === "WEEKLY",
                    className:
                      "[&>div.render-fields]:grid [&>div.render-fields]:grid-cols-7",
                  },
                  fields: [
                    {
                      type: "checkbox",
                      name: "SU",
                      label: "Sun",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "MO",
                      label: "Mon",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "TU",
                      label: "Tue",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "WE",
                      label: "Wed",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "TH",
                      label: "Thu",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "FR",
                      label: "Fri",
                      virtual: true,
                    },
                    {
                      type: "checkbox",
                      name: "SA",
                      label: "Sat",
                      virtual: true,
                    },
                  ],
                },
                {
                  type: "text",
                  name: "monthDays",
                  label:
                    "Select the days of the month that the event will occur",
                  virtual: true,
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData.frequency === "MONTHLY",
                    components: {
                      Field:
                        "/src/collections/Events/components/MonthDayPicker",
                    },
                  },
                  defaultValue: "",
                },
                {
                  type: "text",
                  name: "months",
                  virtual: true,
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData.frequency === "YEARLY",
                    components: {
                      Field: "/src/collections/Events/components/MonthPicker",
                    },
                  },
                  defaultValue: "",
                },
                {
                  type: "date",
                  name: "until",
                  label: "Repeat until...",
                  virtual: true,
                  admin: {
                    description:
                      "The last date the event will occur. Leave blank to repeat indefinitely.",
                    date: {
                      pickerAppearance: "dayAndTime",
                    },
                    // TODO: fix this to only target the input wrapper
                    className: "[&>div]:w-1/2",
                  },
                },
                {
                  type: "number",
                  name: "count",
                  label: "Total occurrences",
                  virtual: true,
                  admin: {
                    description:
                      "Set a total number of occurrences for the event. Leave blank for no limit.",
                    className: "[&_input]:w-1/2",
                  },
                },
                {
                  name: "rrulestringNaturalLang",
                  type: "ui",
                  admin: {
                    components: {
                      Field:
                        "/src/collections/Events/components/RruleNaturalLang",
                    },
                  },
                },
                {
                  name: "rrulestring",
                  type: "text",
                  access: {
                    read: superAdminFieldAccess,
                  },
                  admin: {
                    readOnly: true,
                    description:
                      "Automatically generated rrule string. HIDE THIS FIELD LATER.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Pricing",
          admin: {
            description: "Create different pricing tiers for the event",
          },
          fields: [
            {
              type: "array",
              name: "prices",
              fields: [
                {
                  type: "text",
                  name: "stripePriceId",
                  admin: {
                    readOnly: true,
                  },
                },
                {
                  type: "checkbox",
                  name: "isActive",
                  defaultValue: true,
                },
                {
                  type: "text",
                  name: "label",
                  required: true,
                },
                {
                  type: "text",
                  name: "description",
                  admin: {
                    description: "Helpful description for the pricing tier",
                  },
                },
                {
                  type: "number",
                  name: "amount",
                  min: 0,
                  defaultValue: 0,
                  required: true,
                  hooks: {
                    beforeChange: [convertAmountToDataType],
                    afterRead: [convertAmountToDisplayType],
                  },
                  admin: {
                    description: "Amount in dollars. Set to 0 to make it free.",
                  },
                },
                {
                  type: "number",
                  name: "quantityUnit",
                  defaultValue: 1,
                  admin: {
                    description:
                      "Number of spots one unit represents (typically 1). Eg. 1 order of this may take up 2 spots.",
                  },
                },
                {
                  type: "number",
                  name: "quantity",
                  defaultValue: 0,
                  admin: {
                    hidden: true,
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Settings",
          fields: [
            {
              name: "maxQuantity",
              type: "number",
              label: "Max Quantity",
              required: true,
              min: 1,
              defaultValue: 4,
            },
            {
              name: "minQuantity",
              type: "number",
              label: "Min Quantity",
              required: false,
              min: 1,
            },
          ],
        },
      ],
    },
  ],
};
