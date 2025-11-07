/**
 * Parse a rrulestring into schedule structure
 */

import { RRuleTemporal } from "rrule-temporal";

export const parseRrulestring = (rrulestring: string) => {
	const rrule = new RRuleTemporal({ rruleString: rrulestring, tzid: "UTC" });
	const options = rrule.options();
	return options;
};
