import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";

export const Logs: CollectionConfig<"logs"> = {
	slug: "logs",
	access: {
		read: superAdminOrTenantAdminAccess,
	},
	admin: {
		useAsTitle: "user",
	},
	fields: [
		{
			name: "user",
			relationTo: "users",
			type: "relationship",
			hasMany: false,
			required: true,
		},
	],
};
