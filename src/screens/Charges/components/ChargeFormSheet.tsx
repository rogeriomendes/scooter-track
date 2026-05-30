import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Keyboard, View, Pressable, Text, Platform } from "react-native";

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
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	// When editItem changes or modal opens, populate the fields
	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setVoltage(editItem.batteryLevel.toString());
				setNotes(editItem.notes || "");
				setDate(editItem.date);
			} else {
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

	const handleSaveCharge = async () => {
		if (!voltage) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(logs)
				.set({
					batteryLevel: parseFloat(voltage),
					notes,
					date,
				})
				.where(eq(logs.id, editItem.id));
		} else {
			await db.insert(logs).values({
				scooterId: scooter.id,
				type: "charge",
				distance: 0,
				batteryLevel: parseFloat(voltage),
				notes,
				date,
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
						<View className="flex-row items-center justify-between mb-1">
							<Label className="mb-0">
								{scooter.trackingMode === "percent"
									? "Bateria após Carga (%)"
									: "Voltagem após Carga (V)"}
							</Label>
							<Pressable 
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									if (scooter.trackingMode === "percent") {
										setVoltage("100");
									} else {
										const maxV = BATTERY_CHARTS[scooter.batteryType]?.maxVoltage;
										if (maxV) setVoltage(maxV.toString());
									}
								}}
							>
								<Text className="text-xs font-bold text-success uppercase tracking-widest">
									Carga Total
								</Text>
							</Pressable>
						</View>
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
							onPress={handleSaveCharge}
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
