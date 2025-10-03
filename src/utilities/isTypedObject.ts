import { isNonNullish } from "./isNonNullish";

export const isTypedObject = <T>(
  objectOrID: T | string | number | null | undefined
): objectOrID is T => {
  return (
    isNonNullish(objectOrID) &&
    typeof objectOrID !== "string" &&
    typeof objectOrID !== "number"
  );
};
