import { Variable } from "@thddrew/maily-core/extensions";
import { z } from "zod/v3";

const variablesSchema = z.object({
  ["customer-name"]: z.string().nullish(),
  ["booking-name"]: z.string().nullish(),
  ["booking-id"]: z.string().nullish(),
  ["booking-start-date"]: z.string().nullish(),
  ["booking-end-date"]: z.string().nullish(),
});

const contextSchema = z.object({
  bookingId: z.string().nullish(),
  customerId: z.string().nullish(),
});

export const getVariables = (): Variable[] => {
  const keys = Object.keys(variablesSchema.shape);

  return keys.map((key) => ({
    name: key,
    label: key
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
  }));
};

/**
 * Returns the data for the variables.
 *
 * Typically, this function is called before rendering the email html to hydrate the variables.
 * eg.
 * > const maily = new Maily(...)
 * > getVariablesData({ variables, context })
 * > maily.setVariables(...)
 * > html = await maily.render()
 * > trigger workflow
 */
export const getVariablesData = async ({
  variables,
  context,
}: {
  variables: Variable[];
  context: z.infer<typeof contextSchema>;
}) => {};
