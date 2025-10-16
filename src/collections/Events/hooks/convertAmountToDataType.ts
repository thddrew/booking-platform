import type { FieldHook } from "payload";
import type { Event } from "@/payload-types";

export const convertAmountToDataType: FieldHook<Event, number> = ({
	value,
}) => {
	if (typeof value === "number") {
		return value * 100;
	}

	return 0;
};
