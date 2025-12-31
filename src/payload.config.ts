import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
// Plugins
import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { stripePlugin } from "@payloadcms/plugin-stripe";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
// Access
import { isSuperAdmin } from "./access/isSuperAdmin";
import { superAdminFieldAccess } from "./access/superAdminFieldAccess";
// Collections
import { ConnectedAccounts } from "./collections/Billing/ConnectedAccounts";
import { Payments } from "./collections/Billing/Payments";
import { PaymentsSettings } from "./collections/Billing/PaymentsSettings";
import { Bookings } from "./collections/Bookings";
import { Campaigns } from "./collections/Campaigns";
import { Customers } from "./collections/Customers";
import { Emails } from "./collections/Emails";
import { Events } from "./collections/Events";
import { Logs } from "./collections/Logs";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Tenants } from "./collections/Tenants";
import Users from "./collections/Users";
import { resendWebhookHandler } from "./endpoints/webhooks/resend-handler";
// import { customerCreatedWebhook } from "./lib/stripe/webhookHandlers/customer.created";
// import { customerDeletedWebhook } from "./lib/stripe/webhookHandlers/customer.deleted";
import { checkoutSessionUpdatedWebhook } from "./lib/stripe/webhooks/checkout.session.updated";
import type { Config } from "./payload-types";
import { seed } from "./seed";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
	admin: {
		user: "users",
		autoLogin:
			process.env.NODE_ENV === "development" &&
			process.env.PAYLOAD_AUTOLOGIN === "true"
				? { email: "demo@payloadcms.com", password: "demo" }
				: undefined,
		components: {
			views: {
				dashboard: {
					Component: "/src/components/dashboard/dashboard-view",
					exact: true,
					path: "/",
				},
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
		Media,
		Campaigns,
		Emails,
	],
	endpoints: [resendWebhookHandler],
	upload: {
		abortOnLimit: true,
		safeFileNames: true,
	},
	sharp,
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
				media: {},
				campaigns: {},
				emails: {},
				users: {},
				logs: {},
				paymentsSettings: {},
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
		s3Storage({
			bucket: process.env.S3_BUCKET as string,
			clientUploads: true,
			signedDownloads: {
				shouldUseSignedURL: ({ filename }) => {
					return filename.endsWith(".mp4");
				},
			},
			config: {
				region: "auto",
				endpoint: process.env.S3_ENDPOINT as string,
				credentials: {
					accountId: process.env.S3_ACCOUNT_ID as string,
					accessKeyId: process.env.S3_ACCESS_KEY as string,
					secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
				},
			},
			collections: {
				media: true,
			},
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
