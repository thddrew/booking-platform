import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";

export const Logs: CollectionConfig<"logs"> = {
	slug: "logs",
	access: {
		read: superAdminOrTenantAdminAccess,
	},
	admin: {
		description: "Recent activity logs eg. new booking, updated booking, etc.",
	},
	fields: [],
};
