// WIP

import { z } from "zod";
import type { Customer } from "@/payload-types";
import { TenantOrIdSchema } from "@/types/tenant";

const schema = {
	id: z.string(),
	tenant: TenantOrIdSchema.nullish(),
	firstName: z.string().nullish(),
	lastName: z.string().nullish(),
	fullName: z.string().nullish(),
	email: z.string().nullish(),
	phone: z.string().nullish(),
	bookings: z
		.object({
			docs: z.array(z.string()),
			hasNextPage: z.boolean(),
			totalDocs: z.number(),
		})
		.optional(),
	stripeCustomerId: z.string().nullish(),
	updatedAt: z.string(),
	createdAt: z.string(),
	deletedAt: z.string().nullish(),
	campaign: z
		.object({
			docs: z.array(z.string()),
			hasNextPage: z.boolean(),
			totalDocs: z.number(),
		})
		.optional(),
} satisfies {
	[key in keyof Customer]: z.ZodType<Customer[key]>;
};

export const CustomerSchema = z.object(schema);
export const CustomerOrIdSchema = z.union([CustomerSchema, z.number()]);

export type CustomerSchemaType = z.infer<typeof CustomerSchema>;
export type CustomerOrIdSchemaType = z.infer<typeof CustomerOrIdSchema>;
