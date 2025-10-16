// WIP

import { z } from "zod";
import type { Tenant } from "@/payload-types";

const schema = {
	id: z.string(),
	name: z.string(),
	domain: z.string().nullish(),
	slug: z.string(),
	allowPublicRead: z.boolean(),
	updatedAt: z.string(),
	createdAt: z.string(),
} satisfies {
	[key in keyof Tenant]: z.ZodType<Tenant[key]>;
};

export const TenantSchema = z.object(schema);
export const TenantOrIdSchema = z.union([TenantSchema, z.string()]);

export type TenantSchemaType = z.infer<typeof TenantSchema>;
export type TenantOrIdSchemaType = z.infer<typeof TenantOrIdSchema>;
