"use client";

import { useQueryStates } from "nuqs";
import { useEffect } from "react";
import type { Event } from "@/payload-types";
import { EmptyState } from "./empty-state";
import { EventCard } from "./event-card";
import { SearchBar } from "./search-bar";
import { eventsListSearchParamsParsers } from "./search-params";
import { validateDateRange } from "./utils/validate-date-range";

interface EventsListPageFiltersProps {
	events: Event[];
	tenantSlug?: string;
	currency?: string;
}

export function EventsListPageFilters({
	events,
	tenantSlug,
	currency,
}: EventsListPageFiltersProps) {
	const [{ search, people, startDate, endDate }, setFilters] = useQueryStates(
		eventsListSearchParamsParsers,
	);

	const { isValid: isValidDateRange, startDate: validatedStartDate, endDate: validatedEndDate } =
		validateDateRange(startDate, endDate);

	useEffect(() => {
		if (!isValidDateRange) {
			setFilters({
				startDate: null,
				endDate: null,
			});
		}
	}, [isValidDateRange, setFilters]);

	const displayStartDate = isValidDateRange ? validatedStartDate : null;
	const displayEndDate = isValidDateRange ? validatedEndDate : null;

	const clearFilters = () => {
		setFilters({
			search: null,
			people: null,
			startDate: null,
			endDate: null,
		});
	};

	const hasActiveFilters =
		search.trim() || people !== null || displayStartDate !== null || displayEndDate !== null;

	const handleStartDateChange = (date: Date | null) => {
		setFilters({ startDate: date });
	};

	const handleEndDateChange = (date: Date | null) => {
		setFilters({ endDate: date });
	};

	return (
		<div>
			<SearchBar
				searchQuery={search}
				peopleValue={people}
				startDate={displayStartDate}
				endDate={displayEndDate}
				onSearchChange={(value) => setFilters({ search: value })}
				onPeopleChange={(value) => setFilters({ people: value })}
				onStartDateChange={handleStartDateChange}
				onEndDateChange={handleEndDateChange}
				onClearFilters={clearFilters}
				hasActiveFilters={hasActiveFilters}
			/>

			{events.length === 0 ? (
				<EmptyState
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearFilters}
				/>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							tenantSlug={tenantSlug}
							dateRangeStart={displayStartDate}
							dateRangeEnd={displayEndDate}
							currency={currency}
						/>
					))}
				</div>
			)}
		</div>
	);
}
