import type { CollectionConfig } from "payload";
import { superAdminFieldAccess } from "@/access/superAdminFieldAccess";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import { convertAmountToDataType } from "./hooks/convertAmountToDataType";
import { convertAmountToDisplayType } from "./hooks/convertAmountToDisplayType";
import { generateRrulestring } from "./hooks/generateRrulestring";
import { populateVirtualRruleFields } from "./hooks/populate-virtual-rrule-fields";
import { upsertStripeProduct } from "./hooks/upsertStripeProduct";

const days = [
	{ label: "Sun", value: "SU" },
	{ label: "Mon", value: "MO" },
	{ label: "Tue", value: "TU" },
	{ label: "Wed", value: "WE" },
	{ label: "Thu", value: "TH" },
	{ label: "Fri", value: "FR" },
	{ label: "Sat", value: "SA" },
] as const;

export const Events: CollectionConfig<"events"> = {
	slug: "events",
	trash: true,
	access: {
		create: superAdminOrTenantAdminAccess,
		delete: superAdminOrTenantAdminAccess,
		read: () => true,
		update: superAdminOrTenantAdminAccess,
	},
	versions: {
		drafts: {
			autosave: {
				interval: 5000,
				showSaveDraftButton: true,
			},
			validate: false,
			schedulePublish: true,
		},
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["title", "isActive", "_status"],
	},
	hooks: {
		beforeChange: [generateRrulestring],
		afterChange: [upsertStripeProduct],
	},
	fields: [
		{
			// TODO: use a Switch component instead of a checkbox
			// this likely needs to be a custom component
			type: "checkbox",
			name: "isActive",
			label: "Active",
			defaultValue: true,
			admin: {
				position: "sidebar",
				description: "Turning this off will hide the event from the public",
			},
		},
		{
			type: "text",
			name: "stripeProductId",
			admin: {
				readOnly: true,
				hidden: true,
				position: "sidebar",
			},
		},
		{
			type: "tabs",
			tabs: [
				{
					label: "Description",
					fields: [
						{
							name: "title",
							type: "text",
							label: "Title",
							required: true,
						},
						{
							name: "description",
							type: "richText",
							label: "Description",
						},
						{
							name: "thumbnail",
							type: "upload",
							relationTo: "media",
						},
						{
							name: "gallery",
							type: "upload",
							admin: {
								description:
									"These images will be displayed on the event's page",
							},
							relationTo: "media",
							hasMany: true,
						},
					],
				},
				{
					label: "Schedules",
					name: "schedules",
					admin: {
						description: "Create one or more schedules for the event",
					},
					fields: [
						{
							type: "array",
							name: "schedule",
							admin: {
								components: {
									RowLabel: "/src/collections/Events/field-components/RowLabel",
								},
							},
							fields: [
								{
									type: "checkbox",
									name: "isActive",
									label: "Active",
									defaultValue: true,
								},
								{
									type: "text",
									name: "scheduleName",
								},
								{
									type: "row",
									fields: [
										{
											name: "dtstart",
											type: "date",
											label: "Start Time",
											required: true,
											admin: {
												date: {
													pickerAppearance: "dayAndTime",
												},
											},
										},
										{
											name: "dtend",
											type: "date",
											label: "End Time",
											required: true,
											admin: {
												date: {
													pickerAppearance: "dayAndTime",
												},
											},
										},
									],
								},
								// TODO: need to populate the virtual fields based on the rrule string
								{
									type: "checkbox",
									name: "isRecurring",
									label: "This is a recurring event",
									defaultValue: true,
								},
								{
									type: "row",
									admin: {
										condition: (_, siblingData) => siblingData.isRecurring,
									},
									fields: [
										{
											type: "number",
											virtual: true,
											name: "interval",
											label: "Repeat every...",
											defaultValue: 1,
											hooks: {
												afterRead: [populateVirtualRruleFields],
											},
											admin: {
												step: 1,
												width: "33%",
											},
										},
										{
											type: "select",
											virtual: true,
											name: "frequency",
											admin: {
												components: {
													Label: "/src/components/blank",
												},
												width: "33%",
											},
											hooks: {
												afterRead: [populateVirtualRruleFields],
											},
											defaultValue: "WEEKLY",
											options: [
												{ label: "Hourly", value: "HOURLY" },
												{ label: "Daily", value: "DAILY" },
												{ label: "Weekly", value: "WEEKLY" },
												{ label: "Monthly", value: "MONTHLY" },
												{ label: "Yearly", value: "YEARLY" },
											],
										},
									],
								},
								{
									type: "row",
									admin: {
										condition: (_, siblingData) =>
											siblingData.frequency === "WEEKLY",
										className:
											"[&>div.render-fields]:grid [&>div.render-fields]:grid-cols-7",
									},
									fields: days.map((day) => ({
										type: "checkbox",
										name: day.value,
										label: day.label,
										defaultValue: false,
										hooks: {
											afterRead: [populateVirtualRruleFields],
										},
									})),
								},
								{
									type: "text",
									name: "monthDays",
									label:
										"Select the days of the month that the event will occur",
									virtual: true,
									defaultValue: "",
									hooks: {
										afterRead: [populateVirtualRruleFields],
									},
									admin: {
										condition: (_, siblingData) =>
											siblingData.frequency === "MONTHLY",
										components: {
											Field:
												"/src/collections/Events/field-components/MonthDayPicker",
										},
									},
								},
								{
									type: "text",
									name: "months",
									virtual: true,
									defaultValue: "",
									hooks: {
										afterRead: [populateVirtualRruleFields],
									},
									admin: {
										condition: (_, siblingData) =>
											siblingData.frequency === "YEARLY",
										components: {
											Field:
												"/src/collections/Events/field-components/MonthPicker",
										},
									},
								},
								{
									type: "date",
									name: "until",
									label: "Repeat until...",
									virtual: true,
									hooks: {
										afterRead: [populateVirtualRruleFields],
									},
									admin: {
										description:
											"The last date the event will occur. Leave blank to repeat indefinitely.",
										date: {
											pickerAppearance: "dayAndTime",
										},
										// TODO: fix this to only target the input wrapper
										className: "[&>div]:w-1/2",
									},
								},
								{
									type: "number",
									name: "count",
									label: "Total occurrences",
									virtual: true,
									hooks: {
										afterRead: [populateVirtualRruleFields],
									},
									admin: {
										description:
											"Set a total number of occurrences for the event. Leave blank for no limit.",
										className: "[&_input]:w-1/2",
									},
								},
								{
									name: "rrulestringNaturalLang",
									type: "ui",
									admin: {
										components: {
											Field:
												"/src/collections/Events/field-components/RruleNaturalLang",
										},
									},
								},
								{
									name: "rrulestring",
									type: "text",
									access: {
										read: superAdminFieldAccess,
									},
									admin: {
										readOnly: true,
										hidden: true,
									},
								},
							],
						},
					],
				},
				{
					label: "Pricing",
					admin: {
						description: "Create different pricing tiers for the event",
					},
					fields: [
						{
							type: "array",
							name: "prices",
							fields: [
								{
									type: "text",
									name: "stripePriceId",
									admin: {
										hidden: true,
										readOnly: true,
									},
								},
								{
									type: "checkbox",
									name: "isActive",
									defaultValue: true,
								},
								{
									type: "text",
									name: "label",
									required: true,
								},
								{
									type: "text",
									name: "description",
									admin: {
										description: "Helpful description for the pricing tier",
									},
								},
								{
									type: "number",
									name: "amount",
									min: 0,
									defaultValue: 0,
									required: true,
									hooks: {
										beforeChange: [convertAmountToDataType],
										afterRead: [convertAmountToDisplayType],
									},
									admin: {
										description: "Amount in dollars. Set to 0 to make it free.",
									},
								},
								{
									type: "number",
									name: "quantityUnit",
									defaultValue: 1,
									admin: {
										hidden: true,
										description:
											"Number of spots one unit represents (typically 1). Eg. 1 order of this may take up 2 spots.",
									},
								},
								{
									type: "number",
									name: "quantity",
									defaultValue: 0,
									admin: {
										hidden: true,
									},
								},
							],
						},
					],
				},
				{
					label: "Settings",
					admin: {
						description: "Modify the attendees limits for this event",
					},
					fields: [
						{
							name: "maxQuantity",
							type: "number",
							label: "Max Attendees",
							required: true,
							min: 1,
							defaultValue: 4,
						},
						{
							virtual: true,
							name: "customMax",
							label: "Custom",
							type: "checkbox",
							admin: {
								hidden: true,
							},
						},
						{
							name: "minQuantity",
							type: "number",
							label: "Min Attendees",
							min: 1,
							defaultValue: 1,
						},
						{
							virtual: true,
							name: "customMin",
							label: "Custom",
							type: "checkbox",
							admin: {
								hidden: true,
							},
						},
					],
				},
				{
					label: "Bookings",
					admin: {
						description: "View all past and upcomings bookings for this event",
					},
					fields: [
						{
							name: "bookings",
							type: "join",
							collection: "bookings",
							on: "eventRelation",
						},
					],
				},
			],
		},
	],
};
