import type { CollectionConfig } from "payload";

import { isSuperAdminAccess } from "@/access/isSuperAdmin";
import { createDefaultPages } from "./hooks/createDefaultPages";
import { updateAndDeleteAccess } from "./access/updateAndDelete";

export const Tenants: CollectionConfig = {
	slug: "tenants",
	access: {
		create: isSuperAdminAccess,
		delete: updateAndDeleteAccess,
		read: ({ req }) => Boolean(req.user),
		update: updateAndDeleteAccess,
	},
	admin: {
		useAsTitle: "name",
	},
	hooks: {
		afterChange: [createDefaultPages],
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
			unique: true,
		},
		{
			name: "domain",
			type: "text",
			admin: {
				description: "Used for domain-based tenant handling",
			},
		},
		{
			name: "slug",
			type: "text",
			admin: {
				description: "Used for url paths, example: /tenant-slug/page-slug",
			},
			index: true,
			required: true,
			unique: true,
		},
		{
			name: "allowPublicRead",
			type: "checkbox",
			admin: {
				description:
					"If checked, logging in is not required to read. Useful for building public pages.",
				position: "sidebar",
			},
			defaultValue: false,
			index: true,
		},
	],
};
