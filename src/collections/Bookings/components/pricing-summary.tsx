"use client";

import { useField } from "@payloadcms/ui";
import type { UIFieldClientComponent } from "payload";
import { Fragment } from "react";
import { formatCurrency } from "@/collections/Events/utils/format-currency";
import { Separator } from "@/components/ui/separator";
import { usePayloadFetch } from "@/hooks/use-payload-fetch";
import type { Event } from "@/payload-types";
import { useEventPricingSummary } from "./utils/use-event-pricing-summary";

const PricingSummary: UIFieldClientComponent = (props) => {
  const selectedEventField = useField<number>({
    path: "eventRelation",
  });
  const { data: event } = usePayloadFetch<Event>({
    api: `/api/events/${selectedEventField.value}`,
    options: {
      enabled: !!selectedEventField.value,
    },
  });

  const { totalAmount, totalQuantity, getPriceQuantity, getPriceSubtotal } =
    useEventPricingSummary();

  const eventPrices = event?.prices ?? [];
  const maxQuantity = event?.maxQuantity ?? 0;

  return (
    <>
      <Separator className="my-10" />
      <p className="font-bold mb-2">Summary:</p>
      <div className="grid grid-cols-[250px_auto] gap-2">
        <p className="col-span-2">
          Booking {totalQuantity} / {maxQuantity} attendees
        </p>
        {eventPrices?.map((price) => {
          return (
            <Fragment key={`${price.id}-summary`}>
              <div key={`${price.id}-summary`}>{price.label}</div>
              <p>
                {getPriceQuantity(price.id)} x {formatCurrency(price.amount)} ={" "}
                {formatCurrency(getPriceSubtotal(price))}
              </p>
            </Fragment>
          );
        })}
        <span className="col-span-2 h-4" />
        <p className="text-muted-foreground">Subtotal: </p>
        <span className="font-mono font-bold">
          {formatCurrency(totalAmount)}
        </span>
        <p className="text-muted-foreground">Processing Fee:</p>
        <span className="font-mono font-bold">N/A</span>
        <p className="text-muted-foreground">Tax:</p>{" "}
        <span className="font-mono font-bold">N/A</span>
        <p className="text-muted-foreground">Total:</p>
        <span className="font-mono font-bold">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </>
  );
};

export default PricingSummary;
