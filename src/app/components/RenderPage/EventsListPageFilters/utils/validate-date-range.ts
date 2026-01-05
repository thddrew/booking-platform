import { DATE_RANGE_MAX_DAYS, getMinStartDate } from "../search-params";

export interface DateRangeValidationResult {
	isValid: boolean;
	startDate: Date | null;
	endDate: Date | null;
}

export function validateDateRange(
	startDate: Date | null,
	endDate: Date | null,
): DateRangeValidationResult {
	if (!startDate && !endDate) {
		return {
			isValid: true,
			startDate: null,
			endDate: null,
		};
	}

	const today = getMinStartDate();

	if (startDate) {
		if (startDate < today) {
			return {
				isValid: false,
				startDate: null,
				endDate: null,
			};
		}
	}

	if (endDate && !startDate) {
		return {
			isValid: true,
			startDate: null,
			endDate: endDate,
		};
	}

	if (startDate && !endDate) {
		return {
			isValid: true,
			startDate: startDate,
			endDate: null,
		};
	}

	if (startDate && endDate) {
		if (endDate < startDate) {
			return {
				isValid: false,
				startDate: null,
				endDate: null,
			};
		}

		const daysDiff = Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (daysDiff > DATE_RANGE_MAX_DAYS) {
			return {
				isValid: false,
				startDate: null,
				endDate: null,
			};
		}
	}

	return {
		isValid: true,
		startDate: startDate || null,
		endDate: endDate || null,
	};
}
