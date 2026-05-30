import { BottomSheetInput } from "@/components/BottomSheetInput";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Keyboard, Switch, Text, View, Pressable, Platform } from "react-native";

interface ScooterFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof scooters.$inferSelect | null;
}

export function ScooterFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	onDeleteRequest,
	editItem,
}: ScooterFormSheetProps) {
	const [name, setName] = useState("");
	const [batteryType, setBatteryType] = useState("60V");
	const [trackingMode, setTrackingMode] = useState<"voltage" | "percent">(
		"voltage",
	);
	const [showMaintenance, setShowMaintenance] = useState(true);
	const [initialKm, setInitialKm] = useState("0");
	const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	const { setActiveScooterId } = useAppStore();

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setBatteryType(editItem.batteryType);
				setTrackingMode(editItem.trackingMode as "voltage" | "percent");
				setShowMaintenance(editItem.showMaintenance);
				setInitialKm(editItem.initialKm.toString());
				setPurchaseDate(editItem.purchaseDate || new Date());
			} else {
				setName("");
				setBatteryType("60V");
				setTrackingMode("voltage");
				setShowMaintenance(true);
				setInitialKm("0");
				setPurchaseDate(new Date());
			}
		}
	}, [isOpen, editItem]);

	const onChangeDate = (event: any, selectedDate?: Date) => {
		setShowDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setPurchaseDate(selectedDate);
		}
	};

	const handleSaveScooter = async () => {
		if (!name.trim()) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(scooters)
				.set({
					name,
					batteryType,
					trackingMode,
					showMaintenance,
					initialKm: parseFloat(initialKm) || 0,
					purchaseDate,
				})
				.where(eq(scooters.id, editItem.id));
		} else {
			const [newScooter] = await db
				.insert(scooters)
				.values({
					name,
					batteryType,
					trackingMode,
					showMaintenance,
					initialKm: parseFloat(initialKm) || 0,
					purchaseDate,
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
					<View className="flex-row items-center justify-between mt-2">
						<Text className="text-sm font-medium text-foreground flex-1 pr-4">
							O painel exibe a bateria em Porcentagem (%)?
						</Text>
						<Switch
							value={trackingMode === "percent"}
							onValueChange={(val) =>
								setTrackingMode(val ? "percent" : "voltage")
							}
							trackColor={{ false: "#3f3f46", true: "#10b981" }}
							thumbColor="#ffffff"
						/>
					</View>

					{trackingMode === "voltage" && (
						<View className="gap-2 my-2">
							<Text className="text-sm font-medium text-foreground">
								Selecione a Voltagem
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
					)}
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

					<TextField>
						<Label>Data de Compra</Label>
						<Pressable 
							onPress={() => setShowDatePicker(true)}
							className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
						>
							<Text className="text-foreground text-base">
								{format(purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
							</Text>
						</Pressable>
					</TextField>

					<View className="flex-row items-center justify-between mt-2 mb-2">
						<Text className="text-sm font-medium text-foreground flex-1 pr-4">
							Exibir aba de Manutenção para esta scooter?
						</Text>
						<Switch
							value={showMaintenance}
							onValueChange={setShowMaintenance}
							trackColor={{ false: "#3f3f46", true: "#10b981" }}
							thumbColor="#ffffff"
						/>
					</View>
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
							onPress={handleSaveScooter}
						>
							<Button.Label>
								{editItem ? "Salvar" : "Salvar Scooter"}
							</Button.Label>
						</Button>
					</View>
				</BottomSheet.Content>
			</BottomSheet.Portal>
			{showDatePicker && (
				<DateTimePicker
					value={purchaseDate}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeDate}
					onDismiss={() => setShowDatePicker(false)}
				/>
			)}
		</BottomSheet>
	);
}
