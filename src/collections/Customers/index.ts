import type {
	CollectionConfig,
	EmailField,
	TextField,
	Validate,
} from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import type { Customer } from "@/payload-types";
import { superAdminOrTenantAdminFieldAccess } from "../Billing/fieldAccess/superAdminOrTenantAdmin";
import { createStripeCustomer } from "./hooks/create-stripe-customer";
import { createSubscriber } from "./hooks/create-subscriber";
import { deleteStripeCustomer } from "./hooks/delete-stripe-customer";
import { deleteSubscriber } from "./hooks/delete-subscriber";
import { updateStripeCustomer } from "./hooks/update-stripe-customer";

const phoneValidate: Validate<string, unknown, Customer, TextField> = (
	value,
	ctx,
) => {
	if (!value && !ctx.siblingData.email) {
		return "Email or phone is required";
	}

	return true;
};

const nameValidate: Validate<string, unknown, Customer, TextField> = (
	value,
	ctx,
) => {
	if (!value && !ctx.siblingData.firstName && !ctx.siblingData.lastName) {
		return "First name or last name is required";
	}

	return true;
};

const emailValidate: Validate<
	string,
	unknown,
	// For some reason, the EmailField requires the username field to be present in the siblingData
	Customer & { username?: string },
	EmailField
> = (value, ctx) => {
	if (!value && !ctx.siblingData.phone) {
		return "Email or phone is required";
	}

	return true;
};

export const Customers: CollectionConfig<"customers"> = {
	slug: "customers",
	access: {
		create: superAdminOrTenantAdminAccess,
		delete: superAdminOrTenantAdminAccess,
		read: () => true,
		update: superAdminOrTenantAdminAccess,
	},
	trash: true,
	hooks: {
		beforeChange: [createStripeCustomer, updateStripeCustomer],
		afterChange: [createSubscriber],
		afterDelete: [deleteStripeCustomer, deleteSubscriber],
	},
	admin: {
		useAsTitle: "fullName",
		defaultColumns: ["fullName", "email", "phone"],
	},
	fields: [
		{
			name: "firstName",
			type: "text",
			validate: nameValidate,
		},
		{
			name: "lastName",
			type: "text",
			validate: nameValidate,
		},
		{
			name: "fullName",
			type: "text",
			admin: {
				readOnly: true,
				hidden: true,
			},
			hooks: {
				beforeChange: [
					({ data }) => {
						if (data?.firstName && data?.lastName) {
							return `${data.firstName} ${data.lastName}`;
						}
						return data;
					},
				],
			},
		},
		{
			name: "email",
			type: "email",
			validate: emailValidate,
			admin: {
				description: "One of email or phone is required",
			},
		},
		{
			name: "phone",
			type: "text",
			validate: phoneValidate,
			admin: {
				description: "One of email or phone is required",
			},
		},
		{
			name: "tags",
			type: "array",
			admin: {
				description: "Tags for customer segmentation and marketing",
			},
			fields: [
				{
					name: "tag",
					type: "text",
					required: true,
				},
			],
		},
		{
			name: "notificationPreferences",
			type: "group",
			admin: {
				description: "Customer notification preferences",
			},
			fields: [
				{
					name: "emailEnabled",
					type: "checkbox",
					defaultValue: true,
					label: "Email Notifications",
					admin: {
						description: "Receive booking confirmations, updates, and reminders via email",
					},
				},
				{
					name: "smsEnabled",
					type: "checkbox",
					defaultValue: false,
					label: "SMS Notifications",
					admin: {
						description: "Receive booking reminders via SMS",
					},
				},
				{
					name: "marketingEnabled",
					type: "checkbox",
					defaultValue: true,
					label: "Marketing Emails",
					admin: {
						description: "Receive promotional emails and campaign updates",
					},
				},
			],
		},
		{
			name: "bookings",
			type: "join",
			collection: "bookings",
			on: "customerRelation",
			admin: {
				condition: (_, __, ctx) => ctx.operation !== "create",
			},
		},
		{
			name: "campaign",
			type: "join",
			collection: "campaigns",
			on: "subscribers",
			admin: {
				condition: (_, __, ctx) => ctx.operation !== "create",
			},
		},
		{
			name: "stripeCustomerId",
			type: "text",
			admin: {
				readOnly: true,
				hidden: true,
			},
			access: {
				read: superAdminOrTenantAdminFieldAccess,
			},
		},
	],
};
