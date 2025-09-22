"use client";

import { Button, useField, useFormFields } from "@payloadcms/ui";
import type { ArrayFieldClientComponent } from "payload";
import { useState } from "react";
import { RRuleTemporal } from "rrule-temporal";
import { cn } from "@/lib/utils";
import { convertStringToArray } from "../utils/convertStringToArray";

const months = [
  {
    label: "January",
    value: 1,
  },
  {
    label: "February",
    value: 2,
  },
  {
    label: "March",
    value: 3,
  },
  {
    label: "April",
    value: 4,
  },
  {
    label: "May",
    value: 5,
  },
  {
    label: "June",
    value: 6,
  },
  {
    label: "July",
    value: 7,
  },
  {
    label: "August",
    value: 8,
  },
  {
    label: "September",
    value: 9,
  },
  {
    label: "October",
    value: 10,
  },
  {
    label: "November",
    value: 11,
  },
  {
    label: "December",
    value: 12,
  },
];

/**
 * Using a custom component to manage an array field is not trivial.
 * For now, we'll use a text field to store a stringified array.
 */
export const MonthDayPickerField: ArrayFieldClientComponent = (props) => {
  const rrulestringField = useFormFields(
    ([fields]) => fields[`${props.parentPath}.rrulestring`]
  );

  const parsedRruleString = rrulestringField?.value
    ? new RRuleTemporal({
        rruleString: rrulestringField.value as string,
      })
    : null;

  const rruleOptions = parsedRruleString?.options();

  const monthsField = useField<string>();
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    convertStringToArray(monthsField.value, Number) ||
      rruleOptions?.byMonth ||
      []
  );

  return (
    <div className="grid-cols-4 grid w-fit border border-gray-200 rounded-md mb-4">
      {months.map((month) => (
        <Button
          key={month.value}
          buttonStyle="transparent"
          onClick={() => {
            let updatedMonths = selectedMonths;

            if (updatedMonths.includes(month.value)) {
              updatedMonths = updatedMonths.filter((d) => d !== month.value);
            } else {
              updatedMonths = [...selectedMonths, month.value];
            }

            monthsField.setValue(updatedMonths.join(","));
            setSelectedMonths(updatedMonths);
          }}
          className={cn(
            `flex items-center justify-center aspect-square size-16 my-0 rounded-none
          border-r border-r-gray-200
          [&:nth-child(4n)]:border-r-0
          border-b border-b-gray-200
          [&:nth-last-child(-n+4)]:border-b-0
          `,
            selectedMonths.includes(month.value) && "bg-blue-300"
          )}
        >
          {month.label.slice(0, 3)}
        </Button>
      ))}
    </div>
  );
};

export default MonthDayPickerField;
