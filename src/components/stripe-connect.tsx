"use client";

import {
  type AppearanceOptions,
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import { ConnectComponentsProvider } from "@stripe/react-connect-js";
import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";

const lightModeAppearance: AppearanceOptions = {
  overlays: "drawer",
  variables: {
    colorPrimary: "#212121",
    colorBackground: "#ffffff",
    colorText: "#171717",
    colorDanger: "#dc2626",
    borderRadius: "0.625rem",
    fontFamily: "system-ui, sans-serif",
  },
};

const darkModeAppearance: AppearanceOptions = {
  overlays: "drawer",
  variables: {
    colorPrimary: "#ebebeb",
    colorBackground: "#141414",
    colorText: "#fbfbfb",
    colorDanger: "#ef4444",
    borderRadius: "0.625rem",
    colorBorder: "rgba(167, 167, 167, 0.2)",
    fontFamily: "system-ui, sans-serif",
    overlayBackdropColor: "rgba(167, 167, 167, 0.4)",
  },
};

export const StripeConnect = ({
  fetchClientSecret,
  children,
}: {
  children: React.ReactNode;
  fetchClientSecret: () => Promise<string>;
}) => {
  const mounted = useMounted();
  const [instance, setInstance] = useState<StripeConnectInstance | null>(null);
  const isDarkMode = mounted
    ? document?.querySelector("html")?.getAttribute("data-theme") === "dark"
    : true;

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchClientSecret is not a dependency of this effect
  useEffect(() => {
    // Define appearance variables for light and dark themes
    if (mounted && !instance) {
      const connectInstance = loadConnectAndInitialize({
        fetchClientSecret,
        publishableKey: process.env
          .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
        appearance: isDarkMode ? darkModeAppearance : lightModeAppearance,
      });

      setInstance(connectInstance);
    }
  }, [mounted, instance, isDarkMode]);

  // Update appearance when theme changes
  useEffect(() => {
    if (instance) {
      instance.update({
        appearance: isDarkMode ? darkModeAppearance : lightModeAppearance,
      });
    }
  }, [instance, isDarkMode]);

  if (!instance || !mounted) {
    return null;
  }

  return (
    <ConnectComponentsProvider connectInstance={instance}>
      {children}
    </ConnectComponentsProvider>
  );
};

export default StripeConnect;
