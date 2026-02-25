import type { CollectionConfig } from "payload";

import { isSuperAdminAccess } from "@/access/isSuperAdmin";
import { updateAndDeleteAccess } from "./access/updateAndDelete";

export const Tenants: CollectionConfig = {
	slug: "tenants",
	labels: {
		singular: "Business",
		plural: "Businesses",
	},
	access: {
		create: isSuperAdminAccess,
		delete: updateAndDeleteAccess,
		read: ({ req }) => Boolean(req.user),
		update: updateAndDeleteAccess,
	},
	admin: {
		useAsTitle: "name",
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
				description:
					"Your custom domain for branded booking pages (e.g. bookings.yourbusiness.com)",
			},
		},
		{
			name: "slug",
			type: "text",
			admin: {
				description:
					"Your unique booking page URL (e.g. bookify.app/your-business-name)",
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
					"Allow visitors to browse and book your events without logging in. Required for public booking pages.",
				position: "sidebar",
			},
			defaultValue: false,
			index: true,
		},
		{
			name: "currency",
			type: "select",
			defaultValue: "cad",
			options: [
				{ label: "CAD - Canadian Dollar", value: "cad" },
				{ label: "USD - US Dollar", value: "usd" },
				{ label: "EUR - Euro", value: "eur" },
				{ label: "GBP - British Pound", value: "gbp" },
				{ label: "AUD - Australian Dollar", value: "aud" },
			],
			admin: {
				description: "Currency for event pricing and payments",
				position: "sidebar",
			},
		},
		{
			name: "logo",
			type: "upload",
			relationTo: "media",
			admin: {
				description: "Your business logo",
			},
		},
		{
			name: "brandColor",
			type: "text",
			admin: {
				description: "Primary brand color (hex code, e.g. #4F46E5)",
			},
			defaultValue: "#000000",
		},
		{
			name: "tagline",
			type: "text",
			admin: {
				description: "A short tagline for your business",
			},
		},
		{
			name: "contactEmail",
			type: "email",
			admin: {
				description: "Public contact email address",
			},
		},
		{
			name: "contactPhone",
			type: "text",
			admin: {
				description: "Public contact phone number",
			},
		},
		{
			name: "smsEnabled",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description:
					"Enable SMS notifications for booking confirmations and reminders (requires Novu SMS provider configuration)",
				position: "sidebar",
			},
		},
	],
};
