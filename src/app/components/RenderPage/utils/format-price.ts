const currencySymbols: Record<string, string> = {
	cad: "CA$",
	usd: "$",
	eur: "€",
	gbp: "£",
	aud: "A$",
};

export function formatPrice(amount: number, currency = "cad"): string {
	if (amount === 0) return "Free";
	const symbol = currencySymbols[currency] || "$";
	return `${symbol}${amount.toFixed(2)}`;
}

export function formatPriceShort(amount: number, currency = "cad"): string {
	if (amount === 0) return "Free";
	const symbol = currencySymbols[currency] || "$";
	return `${symbol}${amount.toFixed(0)}`;
}
