function getOrdinalSuffix(day: number): string {
	if (day > 3 && day < 21) return "th";
	switch (day % 10) {
		case 1: return "st";
		case 2: return "nd";
		case 3: return "rd";
		default: return "th";
	}
}

function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export function formatTime(date: Date): string {
	const hour = date.getHours();
	const minute = date.getMinutes();
	const period = hour >= 12 ? "PM" : "AM";
	const displayHour = hour % 12 || 12;

	if (minute === 0) {
		return `${displayHour}${period}`;
	}
	return `${displayHour}:${minute.toString().padStart(2, "0")}${period}`;
}

export function formatShortDate(date: Date): string {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());

	if (isSameDay(dateToCheck, today)) {
		return "Today";
	}

	if (isSameDay(dateToCheck, tomorrow)) {
		return "Tomorrow";
	}

	const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
	const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
	const day = date.getDate();
	const ordinal = getOrdinalSuffix(day);

	return `${weekday}, ${month} ${day}${ordinal}`;
}
