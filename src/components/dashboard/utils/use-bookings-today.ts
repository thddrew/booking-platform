import { usePayloadQuery } from "@/hooks/use-payload-query";
import { getTodayInUTC } from "./get-today";
import { getBookingsToday } from "./server/get-bookings-today";

export const useBookingsToday = (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);

	return usePayloadQuery({
		queryKey: ["bookings-today", startOfDay, endOfDay],
		queryFn: () => getBookingsToday(today),
	});
};
