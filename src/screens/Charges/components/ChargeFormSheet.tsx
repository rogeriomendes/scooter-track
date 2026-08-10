import DateTimePicker, {
	type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";

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

	const onChangeDate = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
		setShowDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const onChangeTime = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
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
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={editItem ? "Editar Recarga" : "Registrar Recarga"}
		>
			<View className="flex-row gap-2">
				<TextField className="flex-1">
					<Label>Data</Label>
					<Pressable
						onPress={() => setShowDatePicker(true)}
						className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
					>
						<Text className="text-foreground text-sm">
							{format(date, "dd/MM/yyyy", { locale: ptBR })}
						</Text>
						<StyledIcon name="calendar" size={16} className="text-muted" />
					</Pressable>
				</TextField>
				<TextField className="flex-1">
					<Label>Hora</Label>
					<Pressable
						onPress={() => setShowTimePicker(true)}
						className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
					>
						<Text className="text-foreground text-sm">
							{format(date, "HH:mm", { locale: ptBR })}
						</Text>
						<StyledIcon name="clock" size={16} className="text-muted" />
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
							: BATTERY_CHARTS[scooter.batteryType]?.maxVoltage.toString() ||
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
				<Button variant="primary" className="flex-1" onPress={handleSaveCharge}>
					<Button.Label>{editItem ? "Salvar" : "Salvar Registro"}</Button.Label>
				</Button>
			</View>

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
		</AppBottomSheet>
	);
}
