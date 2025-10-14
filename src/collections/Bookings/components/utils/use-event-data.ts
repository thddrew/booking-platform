import { payloadSDK } from "@/lib/payload/payload-sdk";
import { usePayloadQuery } from "@/hooks/use-payload-query";
import { Booking, Event } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { useField, useFormFields } from "@payloadcms/ui";
import { FieldState } from "payload";
import { isNonNullish } from "@/utilities/isNonNullish";

type FieldStateWithValue<T> = FieldState & {
  value: T;
};

/**
 * Custom hook to get the booking event data based on the event relation and payment status.
 * It will return the event data from the event relation if the payment status is not paid,
 * otherwise it will return the event data from the event snapshot.
 */
export const useEventData = () => {
  const fieldSelectedEventId = useFormFields(
    ([fields]) => fields.eventRelation as FieldStateWithValue<string>
  );

  const fieldPaymentStatus = useField<Booking["paymentStatus"]>({
    path: "paymentStatus",
  });

  const fieldEventSnapshot = useField<Event>({
    path: "eventSnapshot",
  });

  const { data } = usePayloadQuery({
    queryKey: ["events", fieldSelectedEventId.value],
    queryFn: async () => {
      const data = await payloadSDK.findByID({
        collection: "events",
        id: fieldSelectedEventId.value
          ? extractID(fieldSelectedEventId.value)
          : "",
      });

      return data;
    },
    enabled: !fieldPaymentStatus.value && !!fieldSelectedEventId.value,
  });

  const isPaid = isNonNullish(fieldPaymentStatus.value);

  // If the booking has been paid, use the snapshot of the event, otherwise use the data from the event
  const eventData = fieldPaymentStatus.value ? fieldEventSnapshot.value : data;

  return { data: eventData, isPaid };
};
