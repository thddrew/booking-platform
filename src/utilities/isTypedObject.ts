import { isNonNullish } from "./isNonNullish";

export const isTypedObject = <T>(objectOrID: unknown): objectOrID is T => {
  return (
    isNonNullish(objectOrID) &&
    typeof objectOrID !== "string" &&
    typeof objectOrID !== "number"
  );
};
