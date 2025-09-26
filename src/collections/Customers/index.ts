import type {
  CollectionConfig,
  EmailField,
  TextField,
  Validate,
} from "payload";
import { superAdminOrTenantAdminAccess } from "@/collections/Pages/access/superAdminOrTenantAdmin";
import { Customer } from "@/payload-types";
import { superAdminOrTenantAdminFieldAccess } from "../Billing/fieldAccess/superAdminOrTenantAdmin";
import { createStripeCustomer } from "./hooks/create-stripe-customer";
import { updateStripeCustomer } from "./hooks/update-stripe-customer";

const phoneValidate: Validate<string, unknown, Customer, TextField> = (
  value,
  ctx
) => {
  if (!value && !ctx.siblingData.email) {
    return "Email or phone is required";
  }

  return true;
};

const emailValidate: Validate<
  string,
  unknown,
  // For some reason, the EmailField requires the username field to be present in the siblingData
  Customer & { username?: string },
  EmailField
> = (value, ctx) => {
  if (!value && !ctx.siblingData.phone) {
    return "Email or phone is required";
  }

  return true;
};

export const Customers: CollectionConfig<"customers"> = {
  slug: "customers",
  access: {
    create: superAdminOrTenantAdminAccess,
    delete: superAdminOrTenantAdminAccess,
    read: () => true,
    update: superAdminOrTenantAdminAccess,
  },
  trash: true,
  hooks: {
    beforeChange: [createStripeCustomer, updateStripeCustomer],
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "phone"],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "email",
      type: "email",
      validate: emailValidate,
      admin: {
        description: "One of email or phone is required",
      },
    },
    {
      name: "phone",
      type: "text",
      validate: phoneValidate,
      admin: {
        description: "One of email or phone is required",
      },
    },
    {
      name: "bookings",
      type: "join",
      collection: "bookings",
      on: "customerRelation",
      admin: {
        condition: (_, __, ctx) => ctx.operation !== "create",
      },
    },
    {
      name: "stripeCustomerId",
      type: "text",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      access: {
        read: superAdminOrTenantAdminFieldAccess,
      },
    },
  ],
};
