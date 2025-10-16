import type { CollectionConfig } from "payload";
import { createCampaign } from "./hooks/create-campaign";
import { deleteCampaign } from "./hooks/delete-campaign";

export const Campaigns: CollectionConfig<"campaigns"> = {
	slug: "campaigns",
	versions: true,
	trash: true,
	admin: {
		useAsTitle: "campaignName",
		defaultColumns: ["campaignName", "description"],
	},
	hooks: {
		afterChange: [createCampaign],
		afterDelete: [deleteCampaign],
	},
	fields: [
		{
			type: "tabs",
			tabs: [
				{
					label: "Campaign Details",
					fields: [
						{
							type: "text",
							name: "campaignName",
							required: true,
						},
						{
							type: "text",
							name: "description",
						},
						{
							type: "relationship",
							name: "subscribers",
							relationTo: "customers",
							hasMany: true,
							admin: {
								description:
									"These are the customers who will receive the campaign emails",
							},
						},
					],
				},
				{
					label: "Emails",
					admin: {
						condition: (_, __, ctx) => ctx.operation !== "create",
					},
					fields: [],
				},
			],
		},
	],
};
