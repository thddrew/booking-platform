"use client";

import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";

export const PaymentsTable = dynamic(
  () => import("./payments-table").then((mod) => mod.PaymentsTable),
  {
    ssr: false,
    // TODO: add table skeleton loading
    loading: () => <Loader2Icon className="animate-spin" />,
  }
);
