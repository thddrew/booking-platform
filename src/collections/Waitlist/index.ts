import type { CollectionConfig } from "payload";

export const Waitlist: CollectionConfig = {
	slug: "waitlist",
	admin: {
		useAsTitle: "email",
		defaultColumns: ["email", "event", "dtstart", "notified", "createdAt"],
	},
	access: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
	},
	fields: [
		{
			name: "tenant",
			type: "relationship",
			relationTo: "tenants",
			admin: {
				position: "sidebar",
			},
		},
		{
			name: "event",
			type: "relationship",
			relationTo: "events",
			required: true,
		},
		{
			name: "dtstart",
			type: "date",
			required: true,
			index: true,
			admin: {
				description: "The specific timeslot date/time the customer wants",
			},
		},
		{
			name: "dtend",
			type: "date",
			required: true,
		},
		{
			name: "scheduleId",
			type: "text",
		},
		{
			name: "email",
			type: "email",
			required: true,
			index: true,
		},
		{
			name: "firstName",
			type: "text",
		},
		{
			name: "notified",
			type: "checkbox",
			defaultValue: false,
			admin: {
				description: "Whether the customer has been notified of availability",
			},
		},
	],
};
