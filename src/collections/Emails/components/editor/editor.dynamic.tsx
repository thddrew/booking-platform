"use client";

import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./editor"), {
	ssr: false,
	loading: () => (
		<div className="flex justify-center items-center w-full h-[300px]">
			<Loader2Icon className="animate-spin" />
		</div>
	),
});

export default Editor;
