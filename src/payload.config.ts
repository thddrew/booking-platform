import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
// Plugins
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { stripePlugin } from "@payloadcms/plugin-stripe";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
// Access
import { isSuperAdmin } from "./access/isSuperAdmin";
import { superAdminFieldAccess } from "./access/superAdminFieldAccess";
// Collections
import { ConnectedAccounts } from "./collections/Billing/ConnectedAccounts";
import { Payments } from "./collections/Billing/Payments";
import { PaymentsSettings } from "./collections/Billing/PaymentsSettings";
import { Bookings } from "./collections/Bookings";
import { Customers } from "./collections/Customers";
import { Events } from "./collections/Events";
import { Logs } from "./collections/Logs";
import { Pages } from "./collections/Pages";
import { Tenants } from "./collections/Tenants";
import Users from "./collections/Users";
// import { customerCreatedWebhook } from "./lib/stripe/webhookHandlers/customer.created";
// import { customerDeletedWebhook } from "./lib/stripe/webhookHandlers/customer.deleted";
import { checkoutSessionUpdatedWebhook } from "./lib/stripe/webhookHandlers/checkout.session.updated";
import type { Config } from "./payload-types";
import { seed } from "./seed";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "users",
    autoLogin:
      process.env.NODE_ENV === "development"
        ? { email: "demo@payloadcms.com", password: "demo" }
        : undefined,
    components: {
      views: {
        checkout: {
          exact: true,
          Component: "/src/components/stripe-checkout/checkout-view",
          path: "/checkout",
        },
        checkoutSuccess: {
          Component: "/src/components/stripe-checkout/checkout-success-view",
          path: "/checkout/success",
        },
      },
      beforeDashboard: [
        {
          path: "/src/components/stripe-notification/banner.server",
        },
      ],
      providers: [
        "/src/components/providers/react-query",
        "/src/components/providers/nuqs",
      ],
    },
  },
  collections: [
    Pages,
    Users,
    Tenants,
    Customers,
    ConnectedAccounts,
    Payments,
    PaymentsSettings,
    Logs,
    Events,
    Bookings,
  ],
  db: postgresAdapter({
    idType: "uuid",
    pool: {
      connectionString: process.env.POSTGRES_URL,
    },
  }),
  onInit: async (args) => {
    if (process.env.SEED_DB) {
      await seed(args);
    }
  },
  editor: lexicalEditor({}),
  graphQL: {
    schemaOutputFile: path.resolve(dirname, "generated-schema.graphql"),
  },
  secret: process.env.PAYLOAD_SECRET as string,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        pages: {},
        customers: {},
        connectedAccounts: {},
        payments: {},
        events: {},
        bookings: {},
      },
      tenantField: {
        access: {
          read: superAdminFieldAccess,
          update: superAdminFieldAccess,
        },
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: isSuperAdmin,
    }),
    stripePlugin({
      logs: true,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
      stripeWebhooksEndpointSecret: process.env
        .STRIPE_WEBHOOKS_ENDPOINT_SECRET as string,
      // TODO: handle appropriate webhooks
      // https://docs.stripe.com/cli/trigger#trigger-event
      webhooks: {
        // "customer.created": customerCreatedWebhook,
        // "customer.deleted": customerDeletedWebhook,
        "checkout.session.completed": checkoutSessionUpdatedWebhook,
        "checkout.session.expired": checkoutSessionUpdatedWebhook,
        "checkout.session.async_payment_succeeded":
          checkoutSessionUpdatedWebhook,
        "checkout.session.async_payment_failed": checkoutSessionUpdatedWebhook,
      },
    }),
  ],
});
