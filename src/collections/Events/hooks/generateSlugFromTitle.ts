import type { FieldHook } from "payload";

export const generateSlugFromTitle: FieldHook = async ({ data, value }) => {
	if (value) {
		return value;
	}

	if (!data?.title) {
		return value;
	}

	const slug = data.title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || value;
};

