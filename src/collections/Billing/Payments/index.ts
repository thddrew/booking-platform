import type { CollectionConfig } from "payload";

export const Payments: CollectionConfig<"payments"> = {
	labels: {
		singular: "Payments History",
		plural: "Payments History",
	},
	slug: "payments",
	admin: {
		group: "Payments",
		components: {
			views: {
				list: {
					Component: "/src/collections/Billing/Payments/views/list/index",
				},
			},
		},
	},
	fields: [],
};
