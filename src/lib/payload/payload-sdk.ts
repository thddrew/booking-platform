import { PayloadSDK } from "@payloadcms/sdk";
import type { Config } from "@/payload-types";

export const payloadSDK = new PayloadSDK<Config>({
	baseURL: `${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL as string}/api`,
});
