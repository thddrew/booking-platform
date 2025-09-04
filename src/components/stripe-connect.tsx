"use client";

import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import { ConnectComponentsProvider } from "@stripe/react-connect-js";
import { useEffect, useState } from "react";

export const StripeConnect = ({
  fetchClientSecret,
  children,
}: {
  children: React.ReactNode;
  fetchClientSecret: () => Promise<string>;
}) => {
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);

  useEffect(() => {
    setInstance(
      loadConnectAndInitialize({
        fetchClientSecret,
        publishableKey: process.env
          .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
        appearance: {
          overlays: "drawer",
        },
      })
    );
  }, []);

  if (!instance) {
    return null;
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      {children}
    </ConnectComponentsProvider>
  );
};

export default StripeConnect;
