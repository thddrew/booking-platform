import { type JSONContent, Maily } from "@thddrew/maily-render";
import type { Booking, Customer, Email } from "@/payload-types";
import { isTypedObject } from "@/utilities/isTypedObject";
import { getVariables } from "./variables";

export const renderEmail = async (
	email: Email,
	_context: {
		booking?: Booking | null;
		customer?: Customer | null;
	},
) => {
	const maily = isTypedObject<JSONContent>(email.emailContent)
		? new Maily(email.emailContent)
		: null;

	if (!maily) {
		throw new Error("Invalid email content");
	}

	maily.setPreviewText(email.preview ?? undefined);

	const _variables = getVariables();

	return await maily.render();
};
