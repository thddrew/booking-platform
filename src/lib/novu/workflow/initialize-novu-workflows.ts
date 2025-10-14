import { Config } from "payload";
import { createConfirmBookingWorkflow } from "./confirm-booking";

export const initializeNovuWorkflows: NonNullable<Config["onInit"]> = async (
  payload
) => {
  try {
    await Promise.all([createConfirmBookingWorkflow()]);
  } catch (err) {
    console.error(err);
  }
};
