"use client";

import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { PaymentStatusBadge } from "@/collections/Bookings/components/booking-payment-details";
import {
	getPaymentMethodLabel,
	PAYMENT_METHODS,
	type PaymentMethod,
} from "@/collections/Bookings/utils/payment-methods";
import { getEventPricingSummary } from "@/collections/Bookings/utils/use-event-pricing-summary";
import type { EventPriceType } from "@/collections/Events/utils/schemas";
import { cn } from "@/lib/utils";
import type { Booking, Event } from "@/payload-types";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useBookingsToday } from "./utils/use-bookings-today";

const columnHeader = createColumnHelper<Booking>();

export const BookingsToday = () => {
	const { data } = useBookingsToday(new Date());

	const table = useReactTable({
		getCoreRowModel: getCoreRowModel(),
		data: data?.docs ?? [],
		columns: [
			columnHeader.accessor("dtstart", {
				header: "Date",
				cell: ({ getValue }) => {
					const dtstart = getValue();

					return formatDate(new Date(dtstart), "h:mm a");
				},
			}),
			columnHeader.accessor("eventSnapshot", {
				header: "Event",
				cell: ({ getValue }) => {
					const event = getValue() as unknown as Event;

					return (
						<Link
							href={`/admin/collections/events/${event?.id}`}
							className="underline"
						>
							{event?.title}
						</Link>
					);
				},
			}),
			columnHeader.accessor("pricingSnapshot", {
				header: "Attendees",
				cell: ({ getValue, row }) => {
					const pricing = getEventPricingSummary(
						getValue() as Record<string, EventPriceType>,
					);
					const event = row.original.eventSnapshot as unknown as Event;

					return `${pricing?.totalQuantity} / ${event?.maxQuantity}`;
				},
			}),
			columnHeader.accessor("paymentStatus", {
				header: "Payment Status",
				cell: ({ getValue, row }) => {
					const paymentStatus = getValue();
					const paymentMethod = row.original.paymentMethod as PaymentMethod;

					if (paymentMethod === PAYMENT_METHODS.payNow)
						return <PaymentStatusBadge status={paymentStatus} />;

					return getPaymentMethodLabel(paymentMethod);
				},
			}),
			columnHeader.display({
				id: "actions",
				cell: ({ row }) => {
					return (
						<Link href={`/admin/collections/bookings/${row.original.id}`}>
							<Button variant="ghost" size="icon" className="size-auto p-2">
								<ExternalLinkIcon />
							</Button>
						</Link>
					);
				},
			}),
		],
	});

	const rows = table.getRowModel().rows;
	const headers = table.getFlatHeaders();

	return (
		<div className="twp w-full">
			<h3 className="font-bold text-xl mb-4">Today's Schedule</h3>
			<div
				className="grid"
				style={{
					gridTemplateColumns: `repeat(${headers.length - 1}, 1fr) min-content`,
				}}
			>
				{headers.map((header, i) => (
					<div
						key={header.id}
						className={cn(
							"px-2 py-2 text-sm text-muted-foreground bg-muted",
							i === 0 && "rounded-l-xl",
							i === headers.length - 1 && "rounded-r-xl",
						)}
					>
						{flexRender(header.column.columnDef.header, header.getContext())}
					</div>
				))}
				{rows.map((row) => (
					<Fragment key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<div key={cell.id} className="px-2 py-1 content-center">
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</div>
						))}
					</Fragment>
				))}
			</div>
		</div>
	);
};
