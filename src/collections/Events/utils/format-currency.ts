export const getCurrencyFormatter = (currency: string) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	});

export const formatCurrency = (value: number, currency: string = "CAD") => {
	const formatter = getCurrencyFormatter(currency);

	return formatter.format(value);
};
