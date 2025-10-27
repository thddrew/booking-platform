import type { BlockItem } from "@thddrew/maily-core/blocks";
import { ListChecksIcon } from "lucide-react";

export const bookingUpdateCard: BlockItem = {
	title: "Booking Update Card",
	description: "A card showing booking updates with a bullet list",
	searchTerms: ["booking", "update", "card", "list"],
	icon: <ListChecksIcon className="mly:h-4 mly:w-4" />,
	command: ({ editor, range }) => {
		editor
			.chain()
			.deleteRange(range)
			.insertContent({
				type: "section",
				attrs: {
					padding: "24px",
					borderRadius: "8px",
					border: "1px solid #e5e7eb",
					showIfKey: null,
				},
				content: [
					{
						type: "heading",
						attrs: {
							level: 3,
							textAlign: "left",
							showIfKey: null,
						},
						content: [{ type: "text", text: "Booking Updates" }],
					},
					{ type: "spacer", attrs: { height: 12, showIfKey: null } },
					{
						type: "bulletList",
						content: [
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										attrs: { showIfKey: null },
										content: [
											{ type: "text", text: "Event: Sample Event Name" },
										],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										attrs: { showIfKey: null },
										content: [
											{ type: "text", text: "Start Date: January 1, 2024" },
										],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										attrs: { showIfKey: null },
										content: [
											{ type: "text", text: "End Date: January 2, 2024" },
										],
									},
								],
							},
							{
								type: "listItem",
								content: [
									{
										type: "paragraph",
										attrs: { showIfKey: null },
										content: [{ type: "text", text: "Customer: John Doe" }],
									},
								],
							},
						],
					},
				],
			})
			.run();
	},
};
