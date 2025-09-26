// WIP

import { Customer } from "@/payload-types";
// import { TenantOrIdSchema } from "@/types/tenant";
import { z } from "zod";

const schema: Record<keyof Customer, z.ZodType<Customer[keyof Customer]>> = {
  id: z.number(),
  tenant: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  bookings: z.object({
    docs: z.array(z.number()),
    hasNextPage: z.boolean(),
    totalDocs: z.number(),
  }),
  stripeCustomerId: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  deletedAt: z.string(),
};
