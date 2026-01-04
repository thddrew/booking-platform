"use client";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
	hasActiveFilters: boolean;
	onClearFilters: () => void;
}

export function EmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps) {
	return (
		<div className="text-center py-24">
			<p className="text-xl text-muted-foreground">
				{hasActiveFilters
					? "No events match your filters"
					: "No events available at this time"}
			</p>
			{hasActiveFilters && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onClearFilters}
					className="mt-4"
				>
					Clear filters
				</Button>
			)}
		</div>
	);
}
