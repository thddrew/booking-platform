import configPromise from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function POST(request: Request) {
	try {
		const { businessName, email, password } = await request.json();

		if (!businessName || !email || !password) {
			return NextResponse.json(
				{ error: "Business name, email, and password are required" },
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

		const slug = businessName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");

		if (!slug) {
			return NextResponse.json(
				{ error: "Invalid business name" },
				{ status: 400 },
			);
		}

		const existingSlugs = await payload.find({
			collection: "tenants",
			overrideAccess: true,
			where: { slug: { equals: slug } },
			limit: 1,
		});

		if (existingSlugs.docs.length > 0) {
			return NextResponse.json(
				{
					error:
						"A business with this name already exists. Please choose a different name.",
				},
				{ status: 409 },
			);
		}

		const existingEmail = await payload.find({
			collection: "users",
			overrideAccess: true,
			where: { email: { equals: email } },
			limit: 1,
		});

		if (existingEmail.docs.length > 0) {
			return NextResponse.json(
				{
					error:
						"An account with this email already exists. Please log in instead.",
				},
				{ status: 409 },
			);
		}

		const tenant = await payload.create({
			collection: "tenants",
			overrideAccess: true,
			data: {
				name: businessName,
				slug,
				allowPublicRead: true,
			},
		});

		// Create default email templates for the new tenant
		const defaultTemplates = [
			{
				subject: "Booking Confirmed",
				preview: "Your booking has been confirmed",
				_status: "published",
				tenant: tenant.id,
			},
			{
				subject: "Booking Cancelled",
				preview: "Your booking has been cancelled",
				_status: "published",
				tenant: tenant.id,
			},
			{
				subject: "Booking Updated",
				preview: "Your booking has been updated",
				_status: "published",
				tenant: tenant.id,
			},
			{
				subject: "Booking Reminder",
				preview: "Reminder: Your upcoming booking",
				_status: "published",
				tenant: tenant.id,
			},
		];

		try {
			await Promise.all(
				defaultTemplates.map((template) =>
					payload.create({
						collection: "emails",
						overrideAccess: true,
						data: template,
					}),
				),
			);
		} catch (templateErr) {
			console.error("Failed to create default email templates:", templateErr);
		}

		// Create placeholder pages for terms and privacy
		try {
			await Promise.all([
				payload.create({
					collection: "pages",
					overrideAccess: true,
					data: {
						title: "Terms of Service",
						slug: "terms",
						tenant: tenant.id,
					},
				}),
				payload.create({
					collection: "pages",
					overrideAccess: true,
					data: {
						title: "Privacy Policy",
						slug: "privacy",
						tenant: tenant.id,
					},
				}),
			]);
		} catch (pageErr) {
			console.error("Failed to create placeholder pages:", pageErr);
		}

		const user = await payload.create({
			collection: "users",
			overrideAccess: true,
			data: {
				email,
				password,
				tenant: tenant.id,
				roles: ["user"],
				tenants: [
					{
						tenant: tenant.id,
						roles: ["tenant-admin"],
					},
				],
			},
		});

		const loginResult = await payload.login({
			collection: "users",
			data: { email, password },
		});

		return NextResponse.json({
			success: true,
			token: loginResult.token,
			user: {
				id: user.id,
				email: user.email,
			},
			tenant: {
				id: tenant.id,
				name: tenant.name,
				slug: tenant.slug,
			},
		});
	} catch (err) {
		console.error("Signup error:", err);
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : "Failed to create account",
			},
			{ status: 500 },
		);
	}
}
