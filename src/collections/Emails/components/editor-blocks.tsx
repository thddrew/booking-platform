import {
	type BlockGroupItem,
	blockquote,
	bulletList,
	button,
	clearLine,
	columns,
	divider,
	footer,
	hardBreak,
	heading1,
	heading2,
	heading3,
	// htmlCodeBlock,
	image,
	inlineImage,
	linkCard,
	logo,
	orderedList,
	repeat,
	section,
	spacer,
	text,
} from "@thddrew/maily-core/blocks";
import { FootprintsIcon, Heading1 } from "lucide-react";
import {
	footerCommunityFeedbackCta,
	footerCompanySignature,
	footerCopyrightText,
} from "./footer-blocks";
import {
	headerLogoWithCoverImage,
	headerLogoWithTextHorizontal,
	headerLogoWithTextVertical,
} from "./header-blocks";

export const slashCommands: BlockGroupItem[] = [
	{
		title: "Blocks",
		commands: [
			text,
			heading1,
			heading2,
			heading3,
			bulletList,
			orderedList,
			image,
			logo,
			inlineImage,
			columns,
			section,
			repeat,
			divider,
			spacer,
			button,
			linkCard,
			hardBreak,
			blockquote,
			footer,
			clearLine,
		],
	},
	{
		title: "Components",
		commands: [
			{
				id: "headers",
				title: "Headers",
				description: "Add pre-designed headers block",
				searchTerms: ["header", "headers"],
				icon: <Heading1 className="mly:h-4 mly:w-4" />,
				preview: "https://cdn.usemaily.com/previews/header-preview-xyz.png",
				commands: [
					headerLogoWithTextVertical,
					headerLogoWithTextHorizontal,
					headerLogoWithCoverImage,
				],
			},
			{
				id: "footers",
				title: "Footers",
				description: "Add pre-designed footers block",
				searchTerms: ["footers"],
				icon: <FootprintsIcon className="mly:h-4 mly:w-4" />,
				commands: [
					footerCopyrightText,
					footerCommunityFeedbackCta,
					footerCompanySignature,
				],
			},
			// htmlCodeBlock,
		],
	},
];
