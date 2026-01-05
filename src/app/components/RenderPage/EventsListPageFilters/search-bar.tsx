"use client";

import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchBarProps {
	searchQuery: string;
	peopleValue: number | null;
	startDate: Date | null;
	endDate: Date | null;
	onSearchChange: (value: string | null) => void;
	onPeopleChange: (value: number | null) => void;
	onStartDateChange: (date: Date | null) => void;
	onEndDateChange: (date: Date | null) => void;
	onClearFilters: () => void;
	hasActiveFilters: boolean;
}

export function SearchBar({
	searchQuery,
	peopleValue,
	startDate,
	endDate,
	onSearchChange,
	onPeopleChange,
	onStartDateChange,
	onEndDateChange,
	onClearFilters,
	hasActiveFilters,
}: SearchBarProps) {
	const dateDisplayText = startDate && endDate
		? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
		: startDate
			? `From ${format(startDate, "MMM d, yyyy")}`
			: endDate
				? `Until ${format(endDate, "MMM d, yyyy")}`
				: "Add dates";

	const handleDateRangeChange = (range: { from?: Date | null; to?: Date | null } | undefined) => {
		if (range?.from) {
			const start = new Date(range.from);
			start.setHours(0, 0, 0, 0);
			onStartDateChange(start);
		} else {
			onStartDateChange(null);
		}

		if (range?.to) {
			const end = new Date(range.to);
			end.setHours(23, 59, 59, 999);
			onEndDateChange(end);
		} else {
			onEndDateChange(null);
		}
	};

	return (
		<div className="mb-8">
			<div className="flex items-center gap-0 bg-white border border-border rounded-full shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
				<div className="flex-1 min-w-0">
					<button
						type="button"
						className="w-full text-left px-6 py-4 hover:bg-muted/50 transition-colors"
					>
						<div className="text-xs font-semibold mb-1">Where</div>
						<input
							type="text"
							placeholder="Search events..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value || null)}
							className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
						/>
					</button>
				</div>

				<div className="w-px h-12 bg-border" />

				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="flex-1 min-w-0 text-left px-6 py-4 hover:bg-muted/50 transition-colors"
						>
							<div className="text-xs font-semibold mb-1">When</div>
							<div className={cn(
								"text-sm",
								startDate && endDate ? "text-foreground" : "text-muted-foreground"
							)}>
								{dateDisplayText}
							</div>
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							autoFocus
							mode="range"
							defaultMonth={startDate || new Date()}
							selected={{
								from: startDate || undefined,
								to: endDate || undefined,
							}}
							onSelect={handleDateRangeChange}
							numberOfMonths={2}
						/>
					</PopoverContent>
				</Popover>

				<div className="w-px h-12 bg-border" />

				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="flex-1 min-w-0 text-left px-6 py-4 hover:bg-muted/50 transition-colors"
						>
							<div className="text-xs font-semibold mb-1">Who</div>
							<div className={cn(
								"text-sm",
								peopleValue ? "text-foreground" : "text-muted-foreground"
							)}>
								{peopleValue ? `${peopleValue} ${peopleValue === 1 ? "person" : "people"}` : "Add guests"}
							</div>
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-4" align="start">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-semibold">Guests</div>
									<div className="text-sm text-muted-foreground">Number of people</div>
								</div>
								<div className="flex items-center gap-4">
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => {
											if (peopleValue && peopleValue > 1) {
												onPeopleChange(peopleValue - 1);
											} else {
												onPeopleChange(null);
											}
										}}
										disabled={!peopleValue || peopleValue <= 1}
									>
										−
									</Button>
									<span className="w-8 text-center font-medium">{peopleValue ?? 1}</span>
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => {
											onPeopleChange((peopleValue ?? 1) + 1);
										}}
									>
										+
									</Button>
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>

				<Button
					type="button"
					size="icon"
					className="rounded-full my-2 mr-4 h-12 w-12 shrink-0"
					aria-label="Search"
				>
					<SearchIcon className="h-4 w-4" />
				</Button>
			</div>

			{hasActiveFilters && (
				<div className="flex justify-end mt-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onClearFilters}
						className="text-sm underline"
					>
						Clear all filters
					</Button>
				</div>
			)}
		</div>
	);
}
