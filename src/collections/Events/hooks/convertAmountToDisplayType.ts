import type { FieldHook } from "payload";
import type { Event } from "@/payload-types";
import { convertCentsToDollars } from "../utils/convertCentsToDollars";

export const convertAmountToDisplayType: FieldHook<Event, number> = ({
  value,
}) => {
  if (typeof value === "number") {
    // Convert cents to dollars, handling floating point precision
    return convertCentsToDollars(value);
  }

  return 0;
};
