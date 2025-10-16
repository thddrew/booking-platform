"use client";

import { useField, WarningIcon } from "@payloadcms/ui";
import type { FieldDescriptionClientProps } from "payload";

export const EmailDescription = (
	props: FieldDescriptionClientProps & {
		errorMessage: string;
	},
) => {
	const field = useField<string>();

	if (!field.value)
		return (
			<div className="flex items-start gap-1 mt-2 text-sm text-muted-foreground [&_svg]:shrink-0">
				<WarningIcon />
				<p>{props.errorMessage}</p>
			</div>
		);

	return null;
};

export default EmailDescription;
