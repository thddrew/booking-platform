export const isNonNullish = <T>(value: T | null | undefined): value is T => {
	return value != null && value !== undefined;
};
