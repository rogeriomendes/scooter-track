import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { FormDateTimeField } from "@/components/FormDateTimeField";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, type scooters } from "@/db/schema";

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
	};

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={editItem ? "Editar Uso" : "Registrar Uso"}
		>
			<View className="flex-row gap-2">
				<FormDateTimeField label="Data" value={date} onChange={setDate} />
				<FormDateTimeField
					label="Hora"
					value={date}
					mode="time"
					onChange={setDate}
				/>
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
						? "Nível da Bateria (%) (opcional)"
						: "Voltagem Final (V) (opcional)"}
				</Label>
				<BottomSheetInput
					placeholder={
						scooter.trackingMode === "percent"
							? "Ex: 85"
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
				<Button variant="primary" className="flex-1" onPress={handleSaveTrip}>
					<Button.Label>{editItem ? "Salvar" : "Salvar Registro"}</Button.Label>
				</Button>
			</View>
		</AppBottomSheet>
	);
}
