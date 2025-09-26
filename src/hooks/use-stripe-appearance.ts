"use client";

import type { Appearance } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";

const lightModeAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#212121",
    colorBackground: "#ffffff",
    colorText: "#171717",
    colorDanger: "#dc2626",
    borderRadius: "0.25rem",
    fontFamily: "system-ui, sans-serif",
  },
};

const darkModeAppearance: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#ebebeb",
    colorBackground: "#171717",
    colorText: "#fbfbfb",
    colorDanger: "#ef4444",
    borderRadius: "0.25rem",
    fontFamily: "system-ui, sans-serif",
  },
  rules: {
    ".Input": {
      boxShadow: "none",
    },
  },
};

export const useStripeAppearance = () => {
  const mounted = useMounted();
  const [appearance, setAppearance] = useState<Appearance>(darkModeAppearance);
  const isDarkMode = mounted
    ? document?.querySelector("html")?.getAttribute("data-theme") === "dark"
    : true;

  useEffect(() => {
    // Define appearance variables for light and dark themes
    if (mounted) {
      setAppearance(isDarkMode ? darkModeAppearance : lightModeAppearance);
    }
  }, [mounted, isDarkMode]);

  return appearance;
};
