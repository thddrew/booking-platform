"use client";

import { useField } from "@payloadcms/ui";
import { EqualIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";
import type { UIFieldClientComponent } from "payload";
import { formatCurrency } from "@/collections/Events/utils/format-currency";
import type { EventPriceType } from "@/collections/Events/utils/schemas";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEventData } from "../utils/use-event-data";
import { useEventPricingSummary } from "../utils/use-event-pricing-summary";

const ConfigureAttendees: UIFieldClientComponent = (_props) => {
	const field = useField<Record<string, EventPriceType>>({
		path: "pricingSnapshot",
	});
	const { value: overrideMaxQuantity } = useField<boolean>({
		path: "overrideMaxQuantity",
	});
	const selectedInstanceField = useField<CalendarEvent>({
		path: "selectedScheduleInstanceData",
	});

	const { data: eventData, isPaid: isDisabled } = useEventData();

	const { totalQuantity, getPriceQuantity, getPriceSubtotal } =
		useEventPricingSummary();

	if (!eventData) {
		return (
			<p className="text-muted-foreground">
				Select an event and time slot above to view the available pricing tiers.
			</p>
		);
	}

	if (!selectedInstanceField.value) {
		return (
			<Card className="w-full">
				<CardContent>
					<p>
						Select an available time slot for an event from the calendar to view
						pricing tiers.
					</p>
				</CardContent>
			</Card>
		);
	}

	const setPriceQuantity = (price: EventPriceType, quantity?: number) => {
		if (!price.id) return;

		field.value[price.id] = {
			...price,
			quantity,
		};

		field.setValue({
			...field.value,
		});
	};

	const eventPrices = eventData?.prices ?? [];
	const maxQuantity = eventData?.maxQuantity ?? 0;

	return (
		<div className="mb-6 space-y-3">
			{eventPrices?.map((price) => {
				const value = price.id ? field.value?.[price.id] : null;

				return (
					<div key={price.id}>
						<div className="grid grid-cols-[repeat(1,minmax(120px,min-content))_repeat(4,minmax(calc(var(--spacing)*10),min-content))] gap-6 items-center">
							<div>
								<p>{price.label}</p>
								<p className="font-bold font-mono">
									{formatCurrency(price.amount)}
								</p>
							</div>
							<Button
								size="icon"
								variant="outline"
								className="size-10"
								disabled={isDisabled || !value?.quantity}
								onClick={() => {
									setPriceQuantity(
										price,
										value?.quantity ? value.quantity - 1 : 0,
									);
								}}
							>
								<MinusIcon />
							</Button>
							<p className="text-center whitespace-nowrap">
								{getPriceQuantity(price.id)} /{" "}
								<span
									className={
										overrideMaxQuantity === true ? "text-muted-foreground" : ""
									}
								>
									{maxQuantity}
								</span>
							</p>
							<Button
								size="icon"
								variant="outline"
								className="size-10"
								disabled={
									isDisabled ||
									(overrideMaxQuantity === true
										? false
										: totalQuantity >= maxQuantity)
								}
								onClick={() => {
									setPriceQuantity(
										price,
										value?.quantity ? value.quantity + 1 : 1,
									);
								}}
							>
								<PlusIcon />
							</Button>
							<div className="flex items-center gap-2 font-mono">
								<XIcon className="size-4" /> {formatCurrency(price.amount)}{" "}
								<EqualIcon className="size-4" />
								{formatCurrency(getPriceSubtotal(price))}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default ConfigureAttendees;
