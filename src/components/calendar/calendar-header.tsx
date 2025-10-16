"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarView } from "@/components/calendar/schemas";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
	currentDate: Date;
	view: CalendarView;
	onViewChange: (view: CalendarView) => void;
	onNavigate: (direction: "prev" | "next") => void;
	onToday: () => void;
}

export function CalendarHeader({
	currentDate,
	view,
	onViewChange,
	onNavigate,
	onToday,
}: CalendarHeaderProps) {
	const formatTitle = () => {
		const options: Intl.DateTimeFormatOptions = {};

		switch (view) {
			case "month":
				options.month = "long";
				options.year = "numeric";
				break;
			case "week": {
				const weekStart = new Date(currentDate);
				weekStart.setDate(currentDate.getDate() - currentDate.getDay());
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekStart.getDate() + 6);

				return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
			}
			case "three-day": {
				const day1 = new Date(currentDate);
				const day2 = new Date(currentDate);
				day2.setDate(currentDate.getDate() + 1);
				const day3 = new Date(currentDate);
				day3.setDate(currentDate.getDate() + 2);

				return `${day1.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${day3.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
			}
			case "day":
				options.weekday = "long";
				options.month = "long";
				options.day = "numeric";
				options.year = "numeric";
				break;
		}

		return currentDate.toLocaleDateString("en-US", options);
	};

	return (
		<div className="flex items-center justify-between p-3 border-b bg-card gap-3">
			<div className="flex items-center gap-2 sm:gap-4">
				<Button
					variant="outline"
					size="sm"
					onClick={onToday}
					className="flex items-center gap-2 bg-transparent"
				>
					<CalendarIcon className="h-4 w-4" />
					<span className="hidden sm:inline">Today</span>
				</Button>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onNavigate("prev")}
						aria-label="Previous period"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onNavigate("next")}
						aria-label="Next period"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<h2 className="text-base text-balance">{formatTitle()}</h2>
			</div>

			<div className="flex items-center gap-1">
				{(["month", "week", "three-day", "day"] as CalendarView[]).map(
					(viewType) => (
						<Button
							key={viewType}
							variant={view === viewType ? "default" : "ghost"}
							size="sm"
							onClick={() => onViewChange(viewType)}
							className="capitalize"
						>
							<span className="hidden sm:inline">
								{viewType === "three-day" ? "3-day" : viewType}
							</span>
							<span className="sm:hidden">
								{viewType === "three-day" ? "3" : viewType.charAt(0)}
							</span>
						</Button>
					),
				)}
			</div>
		</div>
	);
}
