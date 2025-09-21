import { z } from "zod";
import type { Event } from "@/payload-types";

type EventPrice = NonNullable<Event["prices"]>[number];

/**
 * We do this to ensure that the schema is up to date with the generated payload types
 */
export const EventPriceSchema: Record<keyof EventPrice, z.ZodType> = {
  stripePriceId: z.string(),
  isActive: z.boolean().default(true),
  label: z.string(),
  description: z.string().optional(),
  amount: z.number().min(0),
  quantityUnit: z.number().default(1),
  quantity: z.number().default(0),
  id: z.string(),
};

export const EventPricesArraySchema = z.array(z.object(EventPriceSchema));
