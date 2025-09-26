import { z } from "zod";
import type { Event } from "@/payload-types";

export type EventPriceType = NonNullable<Event["prices"]>[number];

/**
 * TODO: ensure that the schema is derived from the generated payload types
 * We do this to ensure that the schema is up to date with the generated payload types
 */
export const EventPriceSchema = z.object({
  stripePriceId: z.string(),
  isActive: z.boolean().default(true),
  label: z.string(),
  description: z.string().optional().nullable(),
  amount: z.number().min(0),
  quantityUnit: z.number().default(1),
  quantity: z.number().default(0),
  id: z.string(),
});

export const EventPricesArraySchema = z.array(EventPriceSchema);
export type EventPricesArrayType = z.infer<typeof EventPricesArraySchema>;

export const EventPricesRecordSchema = z.record(z.string(), EventPriceSchema);
export type EventPricesRecordType = z.infer<typeof EventPricesRecordSchema>;
