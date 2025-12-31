"use client";

import { useRowLabel } from "@payloadcms/ui";

export const ArrayRowLabel = () => {
	const { data, rowNumber } = useRowLabel<{ scheduleName?: string }>();

	const customLabel = `${data.scheduleName || "Item"} ${!rowNumber ? "" : String(rowNumber).padStart(1, "0")} `;

	return <div>{customLabel}</div>;
};

export default ArrayRowLabel;
