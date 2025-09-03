import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { isSuperAdmin } from "./access/isSuperAdmin";
import { superAdminFieldAccess } from "./access/superAdminFieldAccess";
import { ConnectedAccounts } from "./collections/Billing/ConnectedAccounts";
import { Payments } from "./collections/Billing/Payments";
import { Customers } from "./collections/Customers";
import { Pages } from "./collections/Pages";
import { Tenants } from "./collections/Tenants";
import Users from "./collections/Users";
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
  },
  collections: [Pages, Users, Tenants, Customers, ConnectedAccounts, Payments],
  db: postgresAdapter({
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
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),
  ],
});
