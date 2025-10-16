import * as React from "react";
import type { XOR } from "@/types/custom";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

type BaseConfirmDialogProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	children: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	initialLoading?: boolean;
	closeOnSecondaryClick?: boolean;
	closeOnPrimaryClick?: boolean;
};

type PrimaryProps = XOR<
	{ PrimaryAction?: React.JSX.Element },
	{
		onPrimaryClick?: () => void | Promise<void>;
		primaryDisabled?: boolean;
		primaryLabel?: React.ReactNode;
	}
>;

type SecondaryProps = XOR<
	{ SecondaryAction?: React.JSX.Element },
	{
		onSecondaryClick?: () => void | Promise<void>;
		secondaryDisabled?: boolean;
		secondaryLabel?: React.ReactNode;
	}
>;

type ConfirmDialogProps = BaseConfirmDialogProps &
	PrimaryProps &
	SecondaryProps;

export function ConfirmDialog({
	open,
	onOpenChange,
	children,
	title,
	description,
	primaryLabel = "Confirm",
	PrimaryAction,
	secondaryLabel = "Cancel",
	SecondaryAction,
	onPrimaryClick,
	onSecondaryClick,
	primaryDisabled = false,
	secondaryDisabled = false,
	initialLoading = false,
	closeOnSecondaryClick = true,
	closeOnPrimaryClick = true,
}: ConfirmDialogProps) {
	const [innerOpen, setInnerOpen] = React.useState(open ?? false);
	const [isLoading, setIsLoading] = React.useState(initialLoading);

	const handleOpenChange = (o: boolean) =>
		onOpenChange ? onOpenChange(o) : setInnerOpen(o);

	const handleConfirm = async () => {
		if (onPrimaryClick) {
			setIsLoading(true);
			try {
				await onPrimaryClick();

				if (closeOnPrimaryClick) {
					handleOpenChange(false);
				}
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleCancel = async () => {
		if (onSecondaryClick) {
			await onSecondaryClick();
		}
		if (closeOnSecondaryClick) {
			handleOpenChange(false);
		}
	};

	return (
		<Dialog open={open ?? innerOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					{title && <DialogTitle>{title}</DialogTitle>}
					{description}
				</DialogHeader>
				<DialogFooter>
					{SecondaryAction ?? (
						<Button
							variant="secondary"
							onClick={handleCancel}
							disabled={secondaryDisabled || isLoading}
						>
							{secondaryLabel}
						</Button>
					)}
					{PrimaryAction ?? (
						<Button
							onClick={handleConfirm}
							disabled={primaryDisabled || isLoading}
						>
							{primaryLabel}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
