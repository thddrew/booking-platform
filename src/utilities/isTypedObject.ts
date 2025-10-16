import { isNonNullish } from "./isNonNullish";

export const isTypedObject = <T>(objectOrID: any): objectOrID is T => {
	return (
		isNonNullish(objectOrID) &&
		typeof objectOrID !== "string" &&
		typeof objectOrID !== "number"
	);
};
