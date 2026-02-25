import type { CollectionConfig } from "payload";

export const PaymentsSettings: CollectionConfig<"paymentsSettings"> = {
	slug: "paymentsSettings",
	admin: {
		group: "Payments",
		components: {
			views: {
				list: {
					Component:
						"/src/collections/Billing/PaymentsSettings/views/list/index",
				},
			},
		},
	},
	fields: [],
};
