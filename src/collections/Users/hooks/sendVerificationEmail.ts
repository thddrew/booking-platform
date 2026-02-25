import type { CollectionAfterChangeHook } from "payload";
import { randomBytes } from "node:crypto";

export const sendVerificationEmail: CollectionAfterChangeHook = async ({
	doc,
	operation,
	req,
}) => {
	if (operation !== "create") return;
	if (doc.verified) return;

	const token = randomBytes(32).toString("hex");

	try {
		await req.payload.update({
			collection: "users",
			id: doc.id,
			overrideAccess: true,
			data: {
				verificationToken: token,
			},
		});

		const verifyUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_PUBLIC_SERVER_URL || ""}/api/users/verify?token=${token}`;

		await req.payload.sendEmail({
			to: doc.email,
			subject: "Verify your email address",
			html: `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
					<h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Verify your email</h1>
					<p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 24px;">
						Thanks for signing up! Please verify your email address by clicking the button below.
					</p>
					<a href="${verifyUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
						Verify Email
					</a>
					<p style="font-size: 14px; color: #6B7280; margin-top: 24px; line-height: 1.5;">
						If you didn't create an account, you can safely ignore this email.
					</p>
				</div>
			`,
		});
	} catch (err) {
		console.error("Failed to send verification email:", err);
	}
};
