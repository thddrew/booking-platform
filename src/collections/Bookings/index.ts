import type { CollectionConfig } from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import {
	CalendarEventSchema,
	type ScheduleInstance,
} from "@/components/calendar/schemas";
import { getDateString } from "../../components/calendar/utils/is-date";
import {
	BOOKING_CANCELLED,
	BOOKING_CONFIRMATION,
	BOOKING_REMINDER,
	BOOKING_UPDATED,
} from "../Emails/utils/email-types";
import { EventPricesRecordSchema } from "../Events/utils/schemas";
import { createAccess } from "./access/create-access";
import { updateAccess } from "./access/update-access";
import { cancelBookingEmail } from "./hooks/cancel-booking-email";
import { newBookingEmail } from "./hooks/new-booking-email";
import { saveSnapshots } from "./hooks/save-snapshots";
import { setDatetimes } from "./hooks/set-datetimes";
import { updateBookingEmail } from "./hooks/update-booking-email";

export const Bookings: CollectionConfig<"bookings"> = {
	slug: "bookings",
	trash: true,
	versions: true,
	access: {
		create: createAccess,
		delete: superAdminOrTenantAdminAccess,
		read: () => true,
		update: updateAccess,
	},
	admin: {
		defaultColumns: ["eventRelation", "dtstart", "dtend", "paymentStatus"],
	},
	hooks: {
		beforeChange: [saveSnapshots, setDatetimes],
		afterChange: [newBookingEmail, updateBookingEmail],
		afterDelete: [cancelBookingEmail],
	},
	fields: [
		{
			type: "group",
			label: "Event & Schedule",
			fields: [
				{
					label: "Event",
					name: "eventRelation",
					type: "relationship",
					relationTo: "events",
					filterOptions: {
						_status: {
							equals: "published",
						},
						isActive: {
							equals: true,
						},
					},
					admin: {
						placeholder:
							"Select an event to view the available time slots. Only published events are available.",
						// TODO: I want to remove the label in the editor but show it in the list column label
						// components: {
						//   Label: "/src/components/blank",
						// },
						allowCreate: false,
					},
				},
				{
					type: "row",
					fields: [
						{
							type: "json",
							name: "selectedScheduleInstanceData",
							admin: {
								components: {
									Field:
										"/src/collections/Bookings/components/selected-schedule-instance",
								},
								condition: (_, siblingData) => !!siblingData.eventRelation,
							},
							validate: (value?: ScheduleInstance | null | string) => {
								if (!value || typeof value === "string") return true;

								const parsed = CalendarEventSchema.safeParse({
									...value,
									dtstart: getDateString(value.dtstart),
									dtend: getDateString(value.dtend),
								});

								return parsed.success ? true : parsed.error.message;
							},
						},
						{
							name: "dtstart",
							label: "Start Date",
							type: "date",
							required: true,
							admin: {
								hidden: true,
							},
						},
						{
							name: "dtend",
							label: "End Date",
							type: "date",
							required: true,
							admin: {
								hidden: true,
							},
						},
					],
				},
				{
					type: "ui",
					name: "eventCalendars",
					admin: {
						components: {
							Field: "/src/collections/Bookings/components/events-calendar",
						},
						condition: (_, siblingData) => siblingData.eventRelation,
					},
				},
			],
		},
		{
			type: "group",
			label: "Customer Information",
			fields: [
				{
					name: "customerRelation",
					type: "relationship",
					relationTo: "customers",
					admin: {
						placeholder:
							"Select an existing customer or press + to create a new customer",
						components: {
							Label: "/src/components/blank",
						},
					},
				},
			],
		},
		{
			type: "group",
			label: "Attendees & Pricing",
			fields: [
				{
					type: "checkbox",
					name: "overrideMaxQuantity",
					label: "Override maximum event attendance",
					admin: {
						disabled: true,
						condition: (_, siblingData) =>
							siblingData.eventRelation &&
							siblingData.selectedScheduleInstanceData,
					},
				},
				{
					type: "ui",
					name: "attendees",
					admin: {
						components: {
							Field: "/src/collections/Bookings/components/configure-attendees",
						},
					},
				},
				{
					type: "ui",
					name: "pricingSummary",
					admin: {
						components: {
							Field: "/src/collections/Bookings/components/pricing-summary",
						},
						condition: (_, siblingData) =>
							siblingData.eventRelation &&
							siblingData.selectedScheduleInstanceData,
					},
				},
			],
		},
		{
			type: "group",
			admin: {
				hidden: true,
			},
			fields: [
				{
					name: "eventSnapshot",
					type: "json",
					defaultValue: {},
				},
				{
					name: "customerSnapshot",
					type: "json",
					defaultValue: {},
				},
				{
					// We don't update this in the hooks because we use this to display the pricing summary in the UI
					name: "pricingSnapshot",
					type: "json",
					defaultValue: {},
					validate: (value) => {
						if (!value) return true;

						const parsed = EventPricesRecordSchema.safeParse(value);
						return parsed.success ? true : parsed.error.message;
					},
				},
			],
		},
		{
			name: "rrulestring",
			type: "text",
			admin: {
				hidden: true,
			},
		},
		{
			type: "group",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: "stripeCheckoutSessionId",
					type: "text",
					admin: {
						readOnly: true,
						hidden: true,
					},
				},
				{
					name: "reminderWorkflowRunId",
					type: "text",
					admin: {
						readOnly: true,
						hidden: true,
					},
				},
				{
					name: "enableReminders",
					type: "checkbox",
					label: "Send Reminder",
					defaultValue: true,
					admin: {
						description: "Send a reminder email 24 hours before the event",
					},
				},
				{
					// TODO: show badge field component
					name: "paymentStatus",
					type: "text",
					admin: {
						readOnly: true,
						components: {
							Cell: "/src/collections/Bookings/components/payment-status-cell",
						},
					},
				},
				{
					type: "ui",
					name: "paymentDetails",
					admin: {
						components: {
							Field:
								"/src/collections/Bookings/components/booking-payment-details",
						},
					},
				},
				{
					name: "paymentMethod",
					type: "select",
					admin: {
						condition: (_, siblingData) => !siblingData.stripeCheckoutSessionId,
					},
					options: [
						{
							label: "Pay now",
							value: "payNow",
						},
						{
							label: "Pay later",
							value: "payLater",
						},
					],
				},
				{
					name: "checkoutForm",
					type: "ui",
					admin: {
						condition: (_, siblingData) =>
							siblingData.paymentMethod === "payNow" &&
							!siblingData.stripeCheckoutSessionId,
						components: {
							Field:
								"/src/collections/Bookings/components/booking-checkout-button",
						},
					},
				},
			],
		},
		{
			type: "group",
			admin: {
				position: "sidebar",
			},
			fields: [
				{
					name: BOOKING_CONFIRMATION,
					type: "relationship",
					relationTo: "emails",
					admin: {
						components: {
							Description: {
								path: "/src/collections/Bookings/components/email-description",
								clientProps: {
									errorMessage:
										"No email is selected. The user will not receive an email when the booking is confirmed.",
								},
							},
						},
					},
				},
				{
					name: BOOKING_CANCELLED,
					type: "relationship",
					relationTo: "emails",
					admin: {
						components: {
							Description: {
								path: "/src/collections/Bookings/components/email-description",
								clientProps: {
									errorMessage:
										"No email is selected. The user will not receive an email when the booking is cancelled.",
								},
							},
						},
					},
				},
				{
					name: BOOKING_UPDATED,
					type: "relationship",
					relationTo: "emails",
					admin: {
						components: {
							Description: {
								path: "/src/collections/Bookings/components/email-description",
								clientProps: {
									errorMessage:
										"No email is selected. The user will not receive an email when the booking is updated.",
								},
							},
						},
					},
				},
				{
					name: BOOKING_REMINDER,
					type: "relationship",
					relationTo: "emails",
					admin: {
						components: {
							Description: {
								path: "/src/collections/Bookings/components/email-description",
								clientProps: {
									errorMessage:
										"No email is selected. The user will not receive a reminder email before the event.",
								},
							},
						},
					},
				},
			],
		},
	],
};
