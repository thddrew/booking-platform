"use client";

import { useRowLabel } from "@payloadcms/ui";
import { format } from "date-fns";

export const RecipientLabel = () => {
	const { data } = useRowLabel<{ createdAt?: string; workflowId?: string }>();

	if (!data.createdAt || !data.workflowId) {
		return undefined;
	}

	const customLabel = `${format(new Date(data.createdAt), "EEEE, MMMM dd, yyyy hh:mm a")}`;

	return <div>{customLabel}</div>;
};

export default RecipientLabel;
