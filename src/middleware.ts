import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

const ratelimit =
	process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
		? new Ratelimit({
				redis: Redis.fromEnv(),
				limiter: Ratelimit.slidingWindow(60, "1 m"),
				prefix: "ratelimit:booking",
			})
		: null;

export async function middleware(request: NextRequest) {
	if (!ratelimit) return NextResponse.next();

	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.ip ||
		"unknown";

	const { success, limit, remaining } = await ratelimit.limit(ip);

	if (!success) {
		return NextResponse.json(
			{ error: "Too many requests. Please try again later." },
			{
				status: 429,
				headers: {
					"X-RateLimit-Limit": limit.toString(),
					"X-RateLimit-Remaining": remaining.toString(),
					"Retry-After": "60",
				},
			},
		);
	}

	const response = NextResponse.next();
	response.headers.set("X-RateLimit-Limit", limit.toString());
	response.headers.set("X-RateLimit-Remaining", remaining.toString());
	return response;
}

export const config = {
	matcher: ["/api/:path*", "/:path*/checkout/:path*"],
};
