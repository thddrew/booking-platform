"use client";

import {
	Button,
	FieldDescription,
	FieldLabel,
	useField,
	useFormFields,
} from "@payloadcms/ui";
import type { ArrayFieldClientComponent } from "payload";
import { useState } from "react";
import { RRuleTemporal } from "rrule-temporal";
import { cn } from "@/lib/utils";
import { convertStringToArray } from "../utils/convertStringToArray";

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

export const MonthDayPickerField: ArrayFieldClientComponent = (props) => {
	const rrulestringField = useFormFields(
		([fields]) => fields[`${props.parentPath}.rrulestring`],
	);

	const parsedRruleString = rrulestringField?.value
		? new RRuleTemporal({
				rruleString: rrulestringField.value as string,
			})
		: null;

	const rruleOptions = parsedRruleString?.options();

	const monthDaysField = useField<string>();

	const [selectedDays, setSelectedDays] = useState<number[]>(
		// Check the local field state first to preserve state between tabs
		convertStringToArray(monthDaysField.value, Number) ||
			rruleOptions?.byMonthDay ||
			[],
	);

	return (
		<>
			<FieldLabel path={props.path} label={props.field.label} />
			<FieldDescription
				className="mb-4"
				path={props.path}
				description={props.field.admin?.description}
			/>
			<div className="grid-cols-7 grid w-fit border border-gray-200 rounded-md mb-4">
				{monthDays.map((day) => (
					<Button
						key={day}
						buttonStyle="transparent"
						onClick={() => {
							let updatedDays = selectedDays;
							if (updatedDays.includes(day)) {
								updatedDays = updatedDays.filter((d) => d !== day);
							} else {
								updatedDays = [...selectedDays, day];
							}
							monthDaysField.setValue(updatedDays.join(","));
							setSelectedDays(updatedDays);
						}}
						className={cn(
							`flex items-center justify-center aspect-square size-16 my-0 rounded-none
          border-r border-r-gray-200
          [&:nth-child(7n)]:border-r-0
          border-b border-b-gray-200
          [&:nth-last-child(-n+3)]:border-b-0
          `,
							selectedDays.includes(day) && "bg-blue-300",
						)}
					>
						{day}
					</Button>
				))}
			</div>
		</>
	);
};

export default MonthDayPickerField;
