import { Dialog } from "heroui-native";
import { Button } from "heroui-native/button";
import type React from "react";
import { View } from "react-native";

interface ConfirmDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	confirmVariant?: React.ComponentProps<typeof Button>["variant"];
}

export function ConfirmDialog({
	isOpen,
	onOpenChange,
	title,
	description,
	confirmText = "Excluir",
	cancelText = "Cancelar",
	onConfirm,
	onCancel,
	confirmVariant = "danger",
}: ConfirmDialogProps) {
	return (
		<Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content>
					<View className="absolute right-2 top-2 z-10">
						<Dialog.Close variant="ghost" />
					</View>
					<View className="mb-5 gap-1.5">
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.Description>{description}</Dialog.Description>
					</View>
					<View className="flex-row justify-end gap-3">
						<Button variant="ghost" size="sm" onPress={onCancel}>
							<Button.Label>{cancelText}</Button.Label>
						</Button>
						<Button size="sm" variant={confirmVariant} onPress={onConfirm}>
							<Button.Label>{confirmText}</Button.Label>
						</Button>
					</View>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
