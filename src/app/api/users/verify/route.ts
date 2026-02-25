import configPromise from "@payload-config";
import { getPayload } from "payload";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return NextResponse.json(
			{ error: "Verification token is required" },
			{ status: 400 },
		);
	}

	try {
		const payload = await getPayload({ config: configPromise });

		const users = await payload.find({
			collection: "users",
			overrideAccess: true,
			where: {
				verificationToken: { equals: token },
			},
			limit: 1,
		});

		const user = users.docs[0];

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid or expired verification token" },
				{ status: 400 },
			);
		}

		if (user.verified) {
			return NextResponse.json({ message: "Email already verified" });
		}

		await payload.update({
			collection: "users",
			id: user.id,
			overrideAccess: true,
			data: {
				verified: true,
				verificationToken: null,
			},
		});

		return NextResponse.json({
			message: "Email verified successfully",
		});
	} catch (err) {
		console.error("Email verification error:", err);
		return NextResponse.json(
			{ error: "Verification failed" },
			{ status: 500 },
		);
	}
}
