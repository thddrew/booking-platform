/**
 * Developer tools component for testing utilities
 * Only visible in development mode
 */
"use server";

import { ServerProps } from "payload";
import { DeveloperToolsClient } from "./developer-tools.client";

const DeveloperToolsServer = async () => {
  // Only show in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <DeveloperToolsClient />;
};

export default DeveloperToolsServer;
