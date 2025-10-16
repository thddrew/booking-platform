export const convertDollarsToCents = (
	value?: number | null,
	defaultValue = 0,
) => {
	if (typeof value === "number") {
		return value * 100;
	}

	return defaultValue;
};
