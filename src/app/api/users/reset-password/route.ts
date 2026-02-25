import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function POST(request: Request) {
	try {
		const { token, password } = await request.json();

		if (!token || !password) {
			return NextResponse.json(
				{ error: "Token and password are required" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters" },
				{ status: 400 },
			);
		}

		const payload = await getPayload({ config: configPromise });

		const users = await payload.find({
			collection: "users",
			overrideAccess: true,
			where: {
				and: [
					{ resetPasswordToken: { equals: token } },
					{
						resetPasswordExpiration: { greater_than: new Date().toISOString() },
					},
				],
			},
			limit: 1,
		});

		const user = users.docs[0];

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid or expired reset token" },
				{ status: 400 },
			);
		}

		await payload.update({
			collection: "users",
			id: user.id,
			overrideAccess: true,
			data: {
				password,
				resetPasswordToken: null,
				resetPasswordExpiration: null,
			},
		});

		return NextResponse.json({ message: "Password reset successfully" });
	} catch (err) {
		console.error("Password reset error:", err);
		return NextResponse.json(
			{ error: "Failed to reset password" },
			{ status: 500 },
		);
	}
}
