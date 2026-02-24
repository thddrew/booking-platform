"use client";

import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelBooking } from "./booking-actions";

interface BookingCancelButtonProps {
	bookingId: string;
	email: string;
	onCancelled: () => void;
}

export function BookingCancelButton({
	bookingId,
	email,
	onCancelled,
}: BookingCancelButtonProps) {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleCancel() {
		setIsPending(true);
		setError(null);

		const result = await cancelBooking(bookingId, email);

		if (result.success) {
			onCancelled();
		} else {
			setError(result.error || "Failed to cancel booking");
			setIsPending(false);
		}
	}

	return (
		<div className="space-y-3">
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button
						variant="outline"
						className="w-full border-destructive text-destructive hover:bg-destructive/10"
						disabled={isPending}
					>
						{isPending ? "Cancelling..." : "Cancel Booking"}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Booking</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure? This cannot be undone. Your booking will be
							cancelled and you will receive a confirmation email.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							Keep Booking
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancel}
							disabled={isPending}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{isPending ? "Cancelling..." : "Yes, Cancel Booking"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{error && <p className="text-sm text-destructive text-center">{error}</p>}
		</div>
	);
}
