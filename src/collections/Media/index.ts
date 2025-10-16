import type { CollectionConfig } from "payload";

export const Media: CollectionConfig<"media"> = {
	slug: "media",
	trash: true,
	upload: {
		mimeTypes: ["image/*", "video/*"],
		adminThumbnail: "thumbnail",
		imageSizes: [
			{
				name: "thumbnail",
				width: 400,
				height: 400,
			},
			{
				name: "mobile",
				width: 600,
				height: 400,
			},
			{
				name: "desktop",
				width: 1200,
				height: 800,
			},
		],
	},
	admin: {
		useAsTitle: "title",
		defaultColumns: ["filename", "updatedAt", "createdAt"],
	},
	fields: [
		{
			name: "title",
			type: "text",
		},
		{
			name: "alt",
			type: "text",
			label: "Alt Text",
			admin: {
				description: "Alt text for the media",
			},
		},
	],
};
