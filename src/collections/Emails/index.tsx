import { extractID } from "@/utilities/extractID";
import { CollectionConfig } from "payload";
import { emailTypes } from "./utils/email-types";

export const Emails: CollectionConfig<"emails"> = {
  slug: "emails",
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
        showSaveDraftButton: true,
      },
      schedulePublish: true,
    },
  },
  trash: true,
  admin: {
    defaultColumns: ["subject", "preview", "updatedAt", "createdAt"],
    useAsTitle: "subject",
    description:
      "Emails can be sent to a campaign, specific customers, or both.",
    livePreview: {
      url: async (args) => {
        const tenantSlug = await args.req.payload.findByID({
          collection: "tenants",
          id: extractID(args.data?.tenant),
        });

        if (!tenantSlug) {
          // TODO: handle error live preview page
          return null;
        }

        return `/tenant-slugs/${tenantSlug.slug}/emails/${args.data?.id}`;
      },
    },
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Email",
          fields: [
            {
              type: "text",
              name: "subject",
              required: true,
            },
            {
              type: "textarea",
              name: "preview",
              admin: {
                rows: 2,
                className: "resize-vertical",
                description:
                  "The preview text is the snippet of text that is pulled into the inbox preview of an email client, usually right after the subject line.",
              },
            },
            {
              type: "json",
              name: "emailContent",
              admin: {
                description:
                  "Any variables will be populated based on where the email is send from. For example, if the email is sent for a booking, the customer name and booking name will be populated.",
                components: {
                  Field: "/src/collections/Emails/components/editor",
                },
              },
            },
          ],
        },
        {
          label: "History",
          fields: [],
        },
      ],
    },
    {
      type: "select",
      admin: {
        position: "sidebar",
      },
      name: "emailType",
      options: emailTypes,
    },
  ],
};
