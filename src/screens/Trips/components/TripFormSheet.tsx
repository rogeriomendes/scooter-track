import { eq } from "drizzle-orm";
import { BottomSheet, Label, TextField } from "heroui-native";
import { Button } from "heroui-native/button";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import * as Haptics from 'expo-haptics';
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";
import { calculateScooterStats } from "@/utils/stats";

interface TripFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	editItem?: typeof logs.$inferSelect | null;
}

export function TripFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	scooter,
	editItem,
}: TripFormSheetProps) {
	const [distance, setDistance] = useState("");
	const [voltage, setVoltage] = useState("");
	const [notes, setNotes] = useState("");

	// When editItem changes or modal opens, populate the fields
	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setDistance(editItem.distance.toString());
				setVoltage(editItem.batteryLevel.toString());
				setNotes(editItem.notes || "");
			} else {
				setDistance("");
				setVoltage("");
				setNotes("");
			}
		}
	}, [isOpen, editItem]);

	const handleSaveTrip = async () => {
		if (!voltage || !distance) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(logs)
				.set({
					distance: parseFloat(distance),
					batteryLevel: parseFloat(voltage),
					notes,
				})
				.where(eq(logs.id, editItem.id));
		} else {
			await db.insert(logs).values({
				scooterId: scooter.id,
				type: "trip",
				distance: parseFloat(distance),
				batteryLevel: parseFloat(voltage),
				notes,
				date: new Date(),
			});
		}

		setDistance("");
		setVoltage("");
		setNotes("");
		onOpenChange(false);
		onSaved();

		// Check for low battery to send notification
		try {
			const allLogs = await db.select().from(logs).where(eq(logs.scooterId, scooter.id));
			const stats = calculateScooterStats(scooter, allLogs);
			if (stats && stats.currentCycleKm >= stats.estimatedAutonomy * 0.8) {
				// To do: Implemented via local state/toast or EAS dev build
				console.log("Bateria baixa! KM atual: ", stats.currentCycleKm);
			}
		} catch (e) {
			console.error("Error", e);
		}
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
					className="gap-4"
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Uso" : "Registrar Uso"}
					</BottomSheet.Title>

					<TextField>
						<Label>Distância Percorrida (km)</Label>
						<BottomSheetInput
							placeholder="Ex: 14.0"
							keyboardType="numeric"
							value={distance}
							onChangeText={setDistance}
							variant="secondary"
						/>
					</TextField>
					<TextField>
						<Label>Voltagem Final (V)</Label>
						<BottomSheetInput
							placeholder={
								BATTERY_CHARTS[scooter.batteryType]?.maxVoltage.toString() ||
								"54.6"
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
							placeholder="Ex: Passeio na praia"
							value={notes}
							onChangeText={setNotes}
							variant="secondary"
						/>
					</TextField>
					<Button variant="primary" className="mt-4" onPress={handleSaveTrip}>
						<Button.Label>
							{editItem ? "Salvar Alterações" : "Salvar Registro"}
						</Button.Label>
					</Button>
				</BottomSheet.Content>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
