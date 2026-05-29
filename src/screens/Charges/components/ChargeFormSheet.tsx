import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import { useEffect, useState } from "react";
import { Keyboard, View } from "react-native";

interface ChargeFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof logs.$inferSelect | null;
}

export function ChargeFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	scooter,
	onDeleteRequest,
	editItem,
}: ChargeFormSheetProps) {
	const [voltage, setVoltage] = useState("");
	const [notes, setNotes] = useState("");

	// When editItem changes or modal opens, populate the fields
	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setVoltage(editItem.batteryLevel.toString());
				setNotes(editItem.notes || "");
			} else {
				setVoltage("");
				setNotes("");
			}
		}
	}, [isOpen, editItem]);

	const handleSaveCharge = async () => {
		if (!voltage) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(logs)
				.set({
					batteryLevel: parseFloat(voltage),
					notes,
				})
				.where(eq(logs.id, editItem.id));
		} else {
			await db.insert(logs).values({
				scooterId: scooter.id,
				type: "charge",
				distance: 0,
				batteryLevel: parseFloat(voltage),
				notes,
				date: new Date(),
			});
		}

		setVoltage("");
		setNotes("");
		onOpenChange(false);
		onSaved();
	};

	return (
		<BottomSheet
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) Keyboard.dismiss();
				onOpenChange(open);
			}}
		>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Content
					keyboardBehavior="interactive"
					keyboardBlurBehavior="restore"
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Recarga" : "Registrar Recarga"}
					</BottomSheet.Title>

					<TextField>
						<Label>
							{scooter.trackingMode === "percent"
								? "Nível da Bateria após Carga (%)"
								: "Voltagem após Carga (V)"}
						</Label>
						<BottomSheetInput
							placeholder={
								scooter.trackingMode === "percent"
									? "Ex: 100"
									: BATTERY_CHARTS[
											scooter.batteryType
										]?.maxVoltage.toString() || "54.6"
							}
							keyboardType="numeric"
							value={voltage}
							onChangeText={setVoltage}
							variant="secondary"
						/>
					</TextField>
					<TextField>
						<Label>Anotações (opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: Carga completa"
							value={notes}
							onChangeText={setNotes}
							variant="secondary"
						/>
					</TextField>
					<View className="flex-row gap-2 mt-4 w-full">
						<Button
							variant="primary"
							className="flex-1"
							onPress={handleSaveCharge}
						>
							<Button.Label>
								{editItem ? "Salvar" : "Salvar Registro"}
							</Button.Label>
						</Button>

						{editItem && onDeleteRequest && (
							<Button
								variant="secondary"
								className="flex-1 bg-danger/10 border border-danger/10"
								feedbackVariant="scale-ripple"
								onPress={() => onDeleteRequest(editItem.id)}
							>
								<Button.Label className="text-danger">Excluir</Button.Label>
							</Button>
						)}
					</View>
				</BottomSheet.Content>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
