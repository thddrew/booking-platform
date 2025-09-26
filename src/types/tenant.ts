// WIP

import { Tenant } from "@/payload-types";
import { z } from "zod";

const schema = {
  id: z.number(),
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
export const TenantOrIdSchema = z.union([TenantSchema, z.number()]);

export type TenantSchemaType = z.infer<typeof TenantSchema>;
export type TenantOrIdSchemaType = z.infer<typeof TenantOrIdSchema>;
