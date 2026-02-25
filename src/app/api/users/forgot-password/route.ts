import { randomBytes } from "node:crypto";
import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ error: "Email is required" }, { status: 400 });
		}

		const payload = await getPayload({ config: configPromise });

		const users = await payload.find({
			collection: "users",
			overrideAccess: true,
			where: { email: { equals: email } },
			limit: 1,
		});

		// Always return success to prevent email enumeration
		if (users.docs.length === 0) {
			return NextResponse.json({
				message: "If an account exists, a reset link has been sent.",
			});
		}

		const user = users.docs[0];
		const token = randomBytes(32).toString("hex");
		const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await payload.update({
			collection: "users",
			id: user.id,
			overrideAccess: true,
			data: {
				resetPasswordToken: token,
				resetPasswordExpiration: expiration.toISOString(),
			},
		});

		const resetUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL || ""}/reset-password?token=${token}`;

		await payload.sendEmail({
			to: user.email,
			subject: "Reset your password",
			html: `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
					<h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Reset your password</h1>
					<p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 24px;">
						We received a request to reset your password. Click the button below to choose a new one.
					</p>
					<a href="${resetUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
						Reset Password
					</a>
					<p style="font-size: 14px; color: #6B7280; margin-top: 24px; line-height: 1.5;">
						This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
					</p>
				</div>
			`,
		});

		return NextResponse.json({
			message: "If an account exists, a reset link has been sent.",
		});
	} catch (err) {
		console.error("Password reset error:", err);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 },
		);
	}
}
