import { extractID } from "@/utilities/extractID";
import { CollectionConfig } from "payload";

export const Emails: CollectionConfig<"emails"> = {
  slug: "emails",
  versions: true,
  trash: true,
  admin: {
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
              type: "json",
              name: "emailContent",
              admin: {
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
      type: "relationship",
      name: "campaign",
      relationTo: "campaigns",
      hasMany: false,
      admin: {
        allowCreate: false,
        position: "sidebar",
        description:
          "The campaign that this email is associated with. Only one campaign is allowed per email.",
      },
    },
    {
      type: "relationship",
      name: "customers",
      relationTo: "customers",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "The customers that will receive this email.",
      },
    },
  ],
};
