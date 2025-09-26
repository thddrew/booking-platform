// WIP

import { Customer } from "@/payload-types";
import { TenantOrIdSchema } from "@/types/tenant";
import { z } from "zod";

const schema = {
  id: z.number(),
  tenant: TenantOrIdSchema.nullish(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  bookings: z
    .object({
      docs: z.array(z.number()),
      hasNextPage: z.boolean(),
      totalDocs: z.number(),
    })
    .optional(),
  stripeCustomerId: z.string().nullish(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string().nullish(),
} satisfies {
  [key in keyof Customer]: z.ZodType<Customer[key]>;
};

export const CustomerSchema = z.object(schema);
export const CustomerOrIdSchema = z.union([CustomerSchema, z.number()]);

export type CustomerSchemaType = z.infer<typeof CustomerSchema>;
export type CustomerOrIdSchemaType = z.infer<typeof CustomerOrIdSchema>;
