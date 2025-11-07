import { usePayloadQuery } from "@/hooks/use-payload-query";
import { getTodayInUTC } from "./get-today";
import { getAvailableEventsToday } from "./server/get-available-events-today";

export const useAvailableEventsToday = (today: Date) => {
	const { startOfDay, endOfDay } = getTodayInUTC(today);

	return usePayloadQuery({
		queryKey: ["available-events-today", startOfDay, endOfDay],
		queryFn: () => getAvailableEventsToday(today),
	});
};
