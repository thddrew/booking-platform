"use client";

import { useField } from "@payloadcms/ui";
import { EyeIcon, Loader2Icon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import type { Email } from "@/payload-types";
import { sendTestEmail } from "./send-test-email";

export default function SendTestEmailForm({
	email,
	tenantId,
}: {
	email: Email;
	tenantId?: string | null;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const field = useField({ path: "testEmail" });

	const parsedEmail = useMemo(() => {
		return z.string().email().safeParse(field.value);
	}, [field.value]);

	const onSubmit = async () => {
		if (!parsedEmail.success) {
			toast.error("");
			return;
		}

		try {
			setLoading(true);
			await sendTestEmail({
				emailTemplateId: email.id,
				emailTo: parsedEmail.data,
				tenantId,
			});
			router.refresh();
			toast.success("Test email sent successfully", {
				description: (
					<span>
						Try the live preview <EyeIcon className="inline w-4 h-4" /> to see
						the email changes in real time.
					</span>
				),
			});
		} catch (err) {
			console.error(err);
			toast.error("Failed to send test email");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="twp">
			<Button
				disabled={!parsedEmail.success || loading}
				onClick={onSubmit}
				className="w-full"
			>
				{loading ? (
					<Loader2Icon className="w-4 h-4 animate-spin" />
				) : (
					<>
						Send test email <SendIcon />
					</>
				)}{" "}
			</Button>
		</div>
	);
}
