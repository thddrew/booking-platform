import type { CollectionSlug } from "payload";
import type { Config } from "@/payload-types";
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
