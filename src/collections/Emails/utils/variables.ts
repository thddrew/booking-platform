import type { Variable } from "@thddrew/maily-core/extensions";
import { z } from "zod/v3";
import type { Booking, Customer, Event } from "@/payload-types";

const customerVariablesSchema = z.object({
	"customer-name": z.string().nullish(),
});

const bookingVariablesSchema = z.object({
	"event-name": z.string().nullish(),
	"booking-id": z.string().nullish(),
	"booking-start-date": z.string().nullish(),
	"booking-end-date": z.string().nullish(),
	"booking-updates": z.string().nullish(),
});

const mapVariableNameToCustomerField = {
	"customer-name": "firstName",
} satisfies Record<
	keyof typeof customerVariablesSchema.shape,
	keyof Customer | ((customer: Customer) => string)
>;

const mapVariableNameToBookingField = {
	"event-name": (context) =>
		(context.booking?.eventSnapshot as unknown as Event)?.title,
	"booking-id": "id",
	"booking-start-date": "dtstart",
	"booking-end-date": "dtend",
	"booking-updates": (context) => {
		return "";
	},
} satisfies Record<
	keyof typeof bookingVariablesSchema.shape,
	keyof Booking | ((context: VariablesContext) => string)
>;

export const contextSchema = z.object({
	bookingId: z.string().nullish(),
	previousBookingId: z.string().nullish(),
	customerId: z.string().nullish(),
});

export const getVariables = (): Variable[] => {
	const keys = [
		...Object.keys(customerVariablesSchema.shape),
		...Object.keys(bookingVariablesSchema.shape),
	];

	return keys.map((key) => ({
		name: key,
		label: key
			.replace(/-/g, " ")
			.replace(/\b\w/g, (char) => char.toUpperCase()),
	}));
};

const isSchemaType = <T extends z.ZodRawShape>(
	schema: T,
	schemaKey: string,
): schemaKey is keyof T & string => {
	return Object.hasOwn(schema, schemaKey);
};

export type VariablesContext = {
	booking?: Booking | null;
	previousBooking?: Booking | null;
	customer?: Customer | null;
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
export const getVariablesData = ({
	variables,
	context,
}: {
	variables: Variable[];
	context: VariablesContext;
}) => {
	const variablesData = variables.reduce<Record<string, string>>(
		(acc, variable) => {
			const schemaKey = variable.name;

			let value: string | null | undefined;

			// Customer variables
			if (isSchemaType(customerVariablesSchema.shape, schemaKey)) {
				if (!context.customer) return acc;

				const mapping = mapVariableNameToCustomerField[schemaKey];
				value = context.customer[mapping] ?? null;
			}

			// Booking variables
			if (isSchemaType(bookingVariablesSchema.shape, schemaKey)) {
				if (!context.booking) return acc;

				const mapping = mapVariableNameToBookingField[schemaKey];
				value =
					typeof mapping === "function"
						? mapping(context)
						: context.booking[mapping];
			}

			if (value != null) {
				acc[schemaKey] = value;
				return acc;
			}

			return acc;
		},
		{},
	);

	return variablesData;
};
