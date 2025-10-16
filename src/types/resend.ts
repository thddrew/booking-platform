export type ContactUpdatedWebhookPayload = {
	type: "contact.updated";
	created_at: string;
	data: {
		id: string;
		audience_id: string;
		created_at: string;
		updated_at: string;
		email: string;
		first_name: string;
		last_name: string;
		unsubscribed: boolean;
	};
};

export type ContactDeletedWebhookPayload = {
	type: "contact.deleted";
	created_at: string;
	data: {
		id: string;
		audience_id: string;
		created_at: string;
		updated_at: string;
		email: string;
		first_name: string;
		last_name: string;
		unsubscribed: boolean;
	};
};

export type ResendWebhookPayload =
	| ContactUpdatedWebhookPayload
	| ContactDeletedWebhookPayload;
