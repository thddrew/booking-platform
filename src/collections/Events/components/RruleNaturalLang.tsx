"use client";

import { FieldLabel, useFormFields } from "@payloadcms/ui";
import { AlertCircleIcon } from "lucide-react";
import type { UIFieldClientComponent } from "payload";
import { ErrorBoundary } from "react-error-boundary";
import { toText } from "rrule-temporal/totext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  generateRruleFromSchedule,
  type Schedule,
} from "../hooks/generateRrulestring";

export const RruleNaturalLang: UIFieldClientComponent = (props) => {
  const schedulePath = props.path.split(".").slice(0, -1).join(".");

  // TODO: damn this is ugly
  const form = useFormFields(([fields]) => ({
    frequency: fields[`${schedulePath}.frequency`].value,
    dtstart: fields[`${schedulePath}.dtstart`].value,
    SU: fields[`${schedulePath}.SU`].value,
    MO: fields[`${schedulePath}.MO`].value,
    TU: fields[`${schedulePath}.TU`].value,
    WE: fields[`${schedulePath}.WE`].value,
    TH: fields[`${schedulePath}.TH`].value,
    FR: fields[`${schedulePath}.FR`].value,
    SA: fields[`${schedulePath}.SA`].value,
    monthDays: fields[`${schedulePath}.monthDays`].value,
    months: fields[`${schedulePath}.months`].value,
    interval: fields[`${schedulePath}.interval`].value,
  }));

  const rrule = generateRruleFromSchedule(form as Schedule);

  return (
    <>
      <FieldLabel label="Schedule repeats.." />

      <div className="mb-4">
        {rrule ? (
          toText(rrule)
        ) : (
          <span className="text-stone-400">Missing start time</span>
        )}
      </div>
    </>
  );
};

export const SafeComponent: UIFieldClientComponent = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <Alert className="my-4">
          <AlertTitle className="flex items-center gap-2">
            <AlertCircleIcon className="size-4" />
            Something went wrong.
          </AlertTitle>
          <AlertDescription>
            There was a problem generating the rrule on our side.
          </AlertDescription>
        </Alert>
      }
    >
      <RruleNaturalLang {...props} />
    </ErrorBoundary>
  );
};

export default SafeComponent;
