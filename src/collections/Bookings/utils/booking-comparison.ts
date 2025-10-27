import type { Booking } from "@/payload-types";

export function hasScheduleChanged(old: Booking, current: Booking): boolean {
	return old.dtstart !== current.dtstart || old.dtend !== current.dtend;
}

export function hasCustomerChanged(old: Booking, current: Booking): boolean {
	return old.customerRelation !== current.customerRelation;
}

export function hasPaymentStatusChanged(
	old: Booking,
	current: Booking,
): boolean {
	return old.paymentStatus !== current.paymentStatus;
}

export function getSignificantChanges(old: Booking, current: Booking) {
	return {
		schedule: hasScheduleChanged(old, current),
		customer: hasCustomerChanged(old, current),
		payment: hasPaymentStatusChanged(old, current),
	};
}
