export const PAYMENT_METHODS = {
	payNow: "payNow",
	payLater: "payLater",
} as const;

export type PaymentMethod =
	(typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const getPaymentMethodLabel = (paymentMethod: PaymentMethod) => {
	return paymentMethod === PAYMENT_METHODS.payNow ? "Paid" : "Pay later";
};
