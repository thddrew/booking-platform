"use client";

import { toast } from "@payloadcms/ui";
import { ConnectPaymentDetails } from "@stripe/react-connect-js";

export const PaymentDetails = ({
  paymentIntentOrChargeId,
  onClose,
}: {
  paymentIntentOrChargeId: string;
  onClose: () => void;
}) => {
  return (
    <ConnectPaymentDetails
      payment={paymentIntentOrChargeId}
      onClose={onClose}
      onLoadError={(e) => {
        console.error(e);
        toast.error("Failed to load Stripe payments");
      }}
    />
  );
};

export default PaymentDetails;
