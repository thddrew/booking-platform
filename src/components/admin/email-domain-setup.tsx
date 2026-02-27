import { Gutter, SetStepNav } from "@payloadcms/ui";
import { EmailDomainClient } from "./email-domain-client";

export default function EmailDomainSetup() {
	return (
		<Gutter>
			<SetStepNav nav={[{ label: "Email Domain Setup" }]} />
			<div className="twp">
				<EmailDomainClient />
			</div>
		</Gutter>
	);
}
