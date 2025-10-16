import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import { superAdminOrTenantAdminFieldAccess } from "../fieldAccess/superAdminOrTenantAdmin";
import { createStripeAccount } from "./hooks/create-stripe-account";
import { removeStripeAccount } from "./hooks/remove-stripe-account";

export const ConnectedAccounts: CollectionConfig<"connectedAccounts"> = {
	slug: "connectedAccounts",
	defaultSort: "-default",
	admin: {
		group: "Billing",
		useAsTitle: "name",
		components: {
			views: {
				edit: {
					onboardStripe: {
						Component:
							"/src/collections/Billing/ConnectedAccounts/views/onboarding/index",
						path: "/onboard-stripe",
					},
				},
			},
		},
	},
	access: {
		create: superAdminOrTenantAdminAccess,
		delete: superAdminOrTenantAdminAccess,
		read: superAdminOrTenantAdminAccess,
		update: superAdminOrTenantAdminAccess,
	},
	hooks: {
		beforeChange: [createStripeAccount],
		afterDelete: [removeStripeAccount],
	},
	fields: [
		{
			name: "default",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description:
					"When enabled, this will be the default connected account for the tenant",
			},
			access: {
				read: superAdminOrTenantAdminFieldAccess,
			},
		},
		{
			name: "name",
			type: "text",
		},
		{
			name: "stripeAccountId",
			type: "text",
			access: {
				read: superAdminOrTenantAdminFieldAccess,
			},
			admin: {
				readOnly: true,
			},
		},
		{
			name: "onboard-stripe-action",
			type: "ui",
			admin: {
				condition: (_data, _siblingData, ctx) => {
					return ctx.operation === "update";
				},
				components: {
					Cell: "/src/collections/Billing/ConnectedAccounts/components/onboard-stripe-cell",
					Field:
						"/src/collections/Billing/ConnectedAccounts/components/onboard-stripe-field",
				},
			},
		},
	],
};
