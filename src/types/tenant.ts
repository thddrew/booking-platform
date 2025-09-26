// WIP

import { Tenant } from "@/payload-types";
import { z } from "zod";

const schema: Record<keyof Tenant, z.ZodType<Tenant[keyof Tenant]>> = {
  id: z.number(),
  name: z.string(),
  domain: z.string(),
  slug: z.string(),
  allowPublicRead: z.boolean(),
  updatedAt: z.string(),
  createdAt: z.string(),
};

export const TenantSchema = z.object(schema);
export const TenantOrIdSchema = z.union([TenantSchema, z.number()]);
export type TenantSchemaType = z.infer<typeof TenantSchema>;
export type TenantOrIdSchemaType = z.infer<typeof TenantOrIdSchema>;
