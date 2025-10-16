import { Booking, Customer, Email } from "@/payload-types";
import { isTypedObject } from "@/utilities/isTypedObject";
import { JSONContent, Maily } from "@thddrew/maily-render";
import { getVariables } from "./variables";

export const renderEmail = async (
  email: Email,
  context: {
    booking?: Booking | null;
    customer?: Customer | null;
  }
) => {
  const maily = isTypedObject<JSONContent>(email.emailContent)
    ? new Maily(email.emailContent)
    : null;

  if (!maily) {
    throw new Error("Invalid email content");
  }

  maily.setPreviewText(email.preview ?? undefined);

  const variables = getVariables();

  return await maily.render();
};
