import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";
import { calculateScooterStats } from "@/utils/stats";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Keyboard, View, Pressable, Text, Platform } from "react-native";

interface TripFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof logs.$inferSelect | null;
}

export function TripFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	scooter,
	onDeleteRequest,
	editItem,
}: TripFormSheetProps) {
	const [distance, setDistance] = useState("");
	const [voltage, setVoltage] = useState("");
	const [notes, setNotes] = useState("");
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	// When editItem changes or modal opens, populate the fields
	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setDistance(editItem.distance.toString());
				setVoltage(editItem.batteryLevel.toString());
				setNotes(editItem.notes || "");
				setDate(editItem.date);
			} else {
				setDistance("");
				setVoltage("");
				setNotes("");
				setDate(new Date());
			}
		}
	}, [isOpen, editItem]);

	const onChangeDate = (event: any, selectedDate?: Date) => {
		setShowDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const onChangeTime = (event: any, selectedDate?: Date) => {
		setShowTimePicker(Platform.OS === "ios");
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

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
					date,
				})
				.where(eq(logs.id, editItem.id));
		} else {
			await db.insert(logs).values({
				scooterId: scooter.id,
				type: "trip",
				distance: parseFloat(distance),
				batteryLevel: parseFloat(voltage),
				notes,
				date,
			});
		}

		setDistance("");
		setVoltage("");
		setNotes("");
		onOpenChange(false);
		onSaved();

		// Check for low battery to send notification
		try {
			const allLogs = await db
				.select()
				.from(logs)
				.where(eq(logs.scooterId, scooter.id));
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
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Uso" : "Registrar Uso"}
					</BottomSheet.Title>

					<View className="flex-row gap-2">
						<TextField className="flex-1">
							<Label>Data</Label>
							<Pressable 
								onPress={() => setShowDatePicker(true)}
								className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
							>
								<Text className="text-foreground text-base">
									{format(date, "dd/MM/yyyy", { locale: ptBR })}
								</Text>
							</Pressable>
						</TextField>
						<TextField className="flex-1">
							<Label>Hora</Label>
							<Pressable 
								onPress={() => setShowTimePicker(true)}
								className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
							>
								<Text className="text-foreground text-base">
									{format(date, "HH:mm", { locale: ptBR })}
								</Text>
							</Pressable>
						</TextField>
					</View>

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
						<Label>
							{scooter.trackingMode === "percent"
								? "Nível da Bateria (%)"
								: "Voltagem Final (V)"}
						</Label>
						<BottomSheetInput
							placeholder={
								scooter.trackingMode === "percent"
									? "Ex: 85"
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
							placeholder="Ex: Passeio na praia"
							value={notes}
							onChangeText={setNotes}
							variant="secondary"
						/>
					</TextField>
					<View className="flex-row gap-2 mt-4 w-full">
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
						<Button
							variant="primary"
							className="flex-1"
							onPress={handleSaveTrip}
						>
							<Button.Label>
								{editItem ? "Salvar" : "Salvar Registro"}
							</Button.Label>
						</Button>
					</View>
				</BottomSheet.Content>
			</BottomSheet.Portal>
			{showDatePicker && (
				<DateTimePicker
					value={date}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeDate}
					onDismiss={() => setShowDatePicker(false)}
				/>
			)}
			{showTimePicker && (
				<DateTimePicker
					value={date}
					mode="time"
					is24Hour={true}
					onValueChange={onChangeTime}
					onDismiss={() => setShowTimePicker(false)}
				/>
			)}
		</BottomSheet>
	);
}
