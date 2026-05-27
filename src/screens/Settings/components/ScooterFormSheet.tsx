import { eq } from "drizzle-orm";
import { BottomSheet, Label, TextField } from "heroui-native";
import { Button } from "heroui-native/button";
import { useEffect, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";

interface ScooterFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	editItem?: typeof scooters.$inferSelect | null;
}

export function ScooterFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	editItem,
}: ScooterFormSheetProps) {
	const [name, setName] = useState("");
	const [batteryType, setBatteryType] = useState("60V");
	const [initialKm, setInitialKm] = useState("0");

	const { setActiveScooterId } = useAppStore();

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setBatteryType(editItem.batteryType);
				setInitialKm(editItem.initialKm.toString());
			} else {
				setName("");
				setBatteryType("60V");
				setInitialKm("0");
			}
		}
	}, [isOpen, editItem]);

	const handleSaveScooter = async () => {
		if (!name.trim()) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(scooters)
				.set({
					name,
					batteryType,
					initialKm: parseFloat(initialKm) || 0,
				})
				.where(eq(scooters.id, editItem.id));
		} else {
			const [newScooter] = await db
				.insert(scooters)
				.values({
					name,
					batteryType,
					initialKm: parseFloat(initialKm) || 0,
					createdAt: new Date(),
				})
				.returning();

			// If it's the very first scooter added, auto-select it.
			// We rely on the parent to fetch scooters and update state.
			// However, we can just proactively set it if we know it's a new one.
			// It's safer if the parent passes activeScooterId or handles it, but since we have useAppStore:
			const existingScooters = await db.select().from(scooters);
			if (existingScooters.length === 1) {
				setActiveScooterId(newScooter.id);
			}
		}

		setName("");
		setInitialKm("0");
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
					className="gap-4"
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Scooter" : "Adicionar Scooter"}
					</BottomSheet.Title>

					<TextField>
						<Label>Nome da Scooter</Label>
						<BottomSheetInput
							placeholder="Ex: Scooter 1"
							value={name}
							onChangeText={setName}
							variant="secondary"
						/>
					</TextField>
					<View className="gap-2 mt-2">
						<Text className="text-sm font-medium text-foreground">
							Tipo de Bateria
						</Text>
						<View className="flex-row flex-wrap gap-2">
							{Object.keys(BATTERY_CHARTS).map((key) => (
								<Button
									key={key}
									size="sm"
									variant={batteryType === key ? "primary" : "secondary"}
									onPress={() => setBatteryType(key)}
								>
									<Button.Label>{BATTERY_CHARTS[key].label}</Button.Label>
								</Button>
							))}
						</View>
					</View>
					<TextField>
						<Label>Odômetro Inicial (KM)</Label>
						<BottomSheetInput
							placeholder="0"
							keyboardType="numeric"
							value={initialKm}
							onChangeText={setInitialKm}
							variant="secondary"
						/>
					</TextField>
					<Button
						variant="primary"
						className="mt-4"
						onPress={handleSaveScooter}
					>
						<Button.Label>
							{editItem ? "Salvar Alterações" : "Salvar"}
						</Button.Label>
					</Button>
				</BottomSheet.Content>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
