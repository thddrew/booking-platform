"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useMemo } from "react";
import type { Event } from "@/payload-types";
import { EmptyState } from "./empty-state";
import { EventCard } from "./event-card";
import { SearchBar } from "./search-bar";

interface EventsListPageFiltersProps {
	events: Event[];
	tenantSlug?: string;
}

export function EventsListPageFilters({
	events,
	tenantSlug,
}: EventsListPageFiltersProps) {
	const [{ search, people, dateRange }, setFilters] = useQueryStates({
		search: parseAsString.withDefault(""),
		people: parseAsInteger,
		dateRange: parseAsString,
	});

	const peopleValue = people;
	const [startDate, endDate] = dateRange
		? dateRange.split(",").map((d) => (d ? new Date(d) : null))
		: [null, null];

	const filteredEvents = useMemo(() => {
		let filtered = events;

		if (search.trim()) {
			const query = search.toLowerCase().trim();
			filtered = filtered.filter((event) =>
				event.title.toLowerCase().includes(query),
			);
		}

		if (peopleValue !== null) {
			filtered = filtered.filter((event) => {
				return (event.maxQuantity ?? 0) >= peopleValue;
			});
		}

		if (startDate && endDate) {
			filtered = filtered.filter((event) => {
				const schedules = event.schedules?.schedule?.filter((s) => s.isActive !== false) || [];
				return schedules.some((schedule) => {
					const scheduleStart = new Date(schedule.dtstart);
					const scheduleEnd = new Date(schedule.dtend);
					return scheduleStart <= endDate && scheduleEnd >= startDate;
				});
			});
		}

		return filtered;
	}, [events, search, peopleValue, startDate, endDate]);

	const clearFilters = () => {
		setFilters({
			search: null,
			people: null,
			dateRange: null,
		});
	};

	const hasActiveFilters =
		search.trim() || peopleValue !== null || startDate !== null || endDate !== null;

	const handleDateRangeSelect = (range: { from?: Date | null; to?: Date | null } | undefined) => {
		if (range?.from && range?.to) {
			setFilters({
				dateRange: `${range.from.toISOString()},${range.to.toISOString()}`,
			});
		} else if (range?.from) {
			setFilters({
				dateRange: `${range.from.toISOString()},`,
			});
		} else {
			setFilters({
				dateRange: null,
			});
		}
	};

	const handleSearchChange = (value: string | null) => {
		setFilters({ search: value });
	};

	const handlePeopleChange = (value: number | null) => {
		setFilters({ people: value });
	};

	return (
		<div>
			<SearchBar
				searchQuery={search}
				peopleValue={peopleValue}
				startDate={startDate}
				endDate={endDate}
				onSearchChange={handleSearchChange}
				onPeopleChange={handlePeopleChange}
				onDateRangeChange={handleDateRangeSelect}
				onClearFilters={clearFilters}
				hasActiveFilters={hasActiveFilters}
			/>

			{filteredEvents.length === 0 ? (
				<EmptyState
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearFilters}
				/>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredEvents.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							tenantSlug={tenantSlug}
							dateRangeStart={startDate}
							dateRangeEnd={endDate}
						/>
					))}
				</div>
			)}
		</div>
	);
}
