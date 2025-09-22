"use client";

import { useField, useFormFields } from "@payloadcms/ui";
import {
  BookPlusIcon,
  EqualIcon,
  MinusIcon,
  PlusIcon,
  Users2Icon,
  XIcon,
} from "lucide-react";
import type { UIFieldClientComponent } from "payload";
import { Fragment, useMemo } from "react";
import { convertCentsToDollars } from "@/collections/Events/utils/convertCentsToDollars";
import { formatCurrency } from "@/collections/Events/utils/format-currency";
import { EventPriceType } from "@/collections/Events/utils/schemas";
import type { CalendarEvent } from "@/components/calendar/schemas";
import { formatDateRange } from "@/components/calendar/utils/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePayloadFetch } from "@/hooks/use-payload-fetch";
import type { Event } from "@/payload-types";

const ConfigureAttendees: UIFieldClientComponent = (props) => {
  const field = useField<Record<string, EventPriceType>>({
    path: "pricingSnapshot",
  });
  const { value: overrideMaxQuantity } = useField<boolean>({
    path: "overrideMaxQuantity",
  });
  const selectedInstanceField = useField<CalendarEvent>({
    path: "selectedScheduleInstanceData",
  });
  const selectedEventField = useField<number>({
    path: "eventRelation",
  });
  const { data: event } = usePayloadFetch<Event>({
    api: `/api/events/${selectedEventField.value}`,
    options: {
      enabled: !!selectedEventField.value,
    },
  });

  const eventPrices = event?.prices ?? [];
  const maxQuantity = event?.maxQuantity ?? 0;

  const { totalAmount, totalQuantity } = useMemo(() => {
    if (!field.value) return { totalAmount: 0, totalQuantity: 0 };

    let totalAmount = 0;
    let totalQuantity = 0;

    for (const price of Object.values(field.value)) {
      totalAmount += price.amount * (price.quantity ?? 0);
      totalQuantity += price.quantity ?? 0;
    }

    return { totalAmount, totalQuantity };
  }, [field.value]);

  if (!selectedEventField.value) {
    return (
      <Card className="w-full">
        <CardContent>
          Select an event and time slot to view the available pricing tiers.
        </CardContent>
      </Card>
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

  const getPriceQuantity = (priceId?: string | null) => {
    if (!priceId) return 0;

    return field.value?.[priceId]?.quantity ?? 0;
  };

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

  const calculatePriceSubtotal = (price: EventPriceType) => {
    if (!price.id) return 0;

    return getPriceQuantity(price.id) * price.amount;
  };

  return (
    <>
      <div>
        {eventPrices?.map((price) => {
          const value = price.id ? field.value?.[price.id] : null;

          return (
            <div
              className="space-y-2"
              key={price.id}
            >
              <div className="grid grid-cols-[repeat(1,minmax(120px,min-content))_repeat(4,minmax(calc(var(--spacing)*10),min-content))] gap-6 items-center mt-6">
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
                  disabled={!value?.quantity}
                  onClick={() => {
                    setPriceQuantity(
                      price,
                      value?.quantity ? value.quantity - 1 : 0
                    );
                  }}
                >
                  <MinusIcon />
                </Button>
                <p className="text-center whitespace-nowrap">
                  {getPriceQuantity(price.id)} /{" "}
                  <span
                    className={
                      overrideMaxQuantity === true
                        ? "text-muted-foreground"
                        : ""
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
                    overrideMaxQuantity === true
                      ? false
                      : totalQuantity >= maxQuantity
                  }
                  onClick={() => {
                    setPriceQuantity(
                      price,
                      value?.quantity ? value.quantity + 1 : 1
                    );
                  }}
                >
                  <PlusIcon />
                </Button>
                <div className="flex items-center gap-2 font-mono">
                  <XIcon className="size-4" /> {formatCurrency(price.amount)}{" "}
                  <EqualIcon className="size-4" />
                  {formatCurrency(calculatePriceSubtotal(price))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Separator className="my-12" />
      <p className="font-bold mb-4">Summary:</p>
      <div className="grid grid-cols-[250px_auto] gap-2">
        {eventPrices?.map((price) => {
          return (
            <Fragment key={`${price.id}-summary`}>
              <div key={`${price.id}-summary`}>
                {price.label} ({getPriceQuantity(price.id)}) x{" "}
                {formatCurrency(price.amount)}
              </div>
              <p>{formatCurrency(calculatePriceSubtotal(price))}</p>
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

export default ConfigureAttendees;
