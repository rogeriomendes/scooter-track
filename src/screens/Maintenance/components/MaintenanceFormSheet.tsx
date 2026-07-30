import DateTimePicker, {
	type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { addDays, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import { useEffect, useState } from "react";
import {
	Keyboard,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { db } from "@/db/client";
import { maintenance, type scooters } from "@/db/schema";

interface MaintenanceFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof maintenance.$inferSelect | null;
	currentTotalKm: number;
}

export function MaintenanceFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	scooter,
	onDeleteRequest,
	editItem,
	currentTotalKm,
}: MaintenanceFormSheetProps) {
	const [name, setName] = useState("");
	const [type, setType] = useState<"km" | "months" | "date" | "mixed">("km");
	const [intervalKm, setIntervalKm] = useState("");
	const [intervalMonths, setIntervalMonths] = useState("");
	const [lastDate, setLastDate] = useState(new Date());
	const [showLastDatePicker, setShowLastDatePicker] = useState(false);
	const [targetDate, setTargetDate] = useState(new Date());
	const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
	const [resetWear, setResetWear] = useState(false);

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setType(editItem.type as any);
				setIntervalKm(
					editItem.intervalKm ? editItem.intervalKm.toString() : "",
				);
				setIntervalMonths(
					editItem.intervalMonths ? editItem.intervalMonths.toString() : "",
				);
				setLastDate(editItem.lastMaintenanceDate || new Date());
				setTargetDate(editItem.targetDate || new Date());
				setResetWear(false);
			} else {
				setName("");
				setType("km");
				setIntervalKm("");
				setIntervalMonths("");
				setLastDate(new Date());
				setTargetDate(new Date());
				setResetWear(false);
			}
		}
	}, [isOpen, editItem]);

	const onChangeTargetDate = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
		setShowTargetDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setTargetDate(selectedDate);
		}
	};

	const onChangeLastDate = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
		setShowLastDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setLastDate(selectedDate);
		}
	};

	const handleSave = async () => {
		if (!name) return;
		if (type === "km" && !intervalKm) return;
		if (type === "months" && !intervalMonths) return;
		if (type === "mixed" && (!intervalKm || !intervalMonths)) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		const isResetting = resetWear || !editItem;

		const dataToSave = {
			name,
			type,
			intervalKm:
				type === "km" || type === "mixed" ? parseFloat(intervalKm) || 0 : 0,
			intervalMonths:
				type === "months" || type === "mixed"
					? parseInt(intervalMonths, 10) || 0
					: null,
			targetDate: type === "date" ? targetDate : null,
			lastMaintenanceKm: isResetting
				? currentTotalKm
				: editItem
					? editItem.lastMaintenanceKm
					: currentTotalKm,
			lastMaintenanceDate: isResetting
				? new Date()
				: type !== "km"
					? lastDate
					: editItem?.lastMaintenanceDate || new Date(),
		};

		if (editItem) {
			await db
				.update(maintenance)
				.set(dataToSave)
				.where(eq(maintenance.id, editItem.id));
		} else {
			await db.insert(maintenance).values({
				scooterId: scooter.id,
				...dataToSave,
				createdAt: new Date(),
			});
		}

		setName("");
		setIntervalKm("");
		setIntervalMonths("");
		setResetWear(false);
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
					<ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
						<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
							{editItem ? "Editar Manutenção" : "Adicionar Peça/Serviço"}
						</BottomSheet.Title>

						<TextField>
							<Label>Nome da Peça/Serviço</Label>
							<BottomSheetInput
								placeholder="Ex: Pastilha de freio traseira"
								value={name}
								onChangeText={setName}
								variant="secondary"
							/>
						</TextField>

						<View className="my-2">
							<Label className="mb-2">Tipo de Controle</Label>
							<View className="flex-row flex-wrap gap-2">
								<Button
									size="sm"
									variant={type === "km" ? "primary" : "secondary"}
									onPress={() => setType("km")}
								>
									<Button.Label>Por KM</Button.Label>
								</Button>
								<Button
									size="sm"
									variant={type === "months" ? "primary" : "secondary"}
									onPress={() => setType("months")}
								>
									<Button.Label>Por Meses</Button.Label>
								</Button>
								<Button
									size="sm"
									variant={type === "date" ? "primary" : "secondary"}
									onPress={() => setType("date")}
								>
									<Button.Label>Data Fixa</Button.Label>
								</Button>
								<Button
									size="sm"
									variant={type === "mixed" ? "primary" : "secondary"}
									onPress={() => setType("mixed")}
								>
									<Button.Label>Misto</Button.Label>
								</Button>
							</View>
						</View>

						{(type === "km" || type === "mixed") && (
							<TextField>
								<Label>Intervalo de Troca (KM)</Label>
								<BottomSheetInput
									placeholder="Ex: 1000"
									keyboardType="numeric"
									value={intervalKm}
									onChangeText={setIntervalKm}
									variant="secondary"
								/>
							</TextField>
						)}

						{(type === "months" || type === "mixed") && (
							<TextField>
								<Label>Intervalo de Troca (Meses)</Label>
								<BottomSheetInput
									placeholder="Ex: 6"
									keyboardType="numeric"
									value={intervalMonths}
									onChangeText={setIntervalMonths}
									variant="secondary"
								/>
							</TextField>
						)}

						{type !== "km" && (
							<TextField>
								<Label>Data de Início</Label>
								<Pressable
									onPress={() => setShowLastDatePicker(true)}
									className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
								>
									<Text className="text-foreground text-base">
										{format(lastDate, "dd/MM/yyyy", { locale: ptBR })}
									</Text>
								</Pressable>
							</TextField>
						)}

						{type === "date" && (
							<TextField>
								<Label>Data de Vencimento</Label>
								<Pressable
									onPress={() => setShowTargetDatePicker(true)}
									className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
								>
									<Text className="text-foreground text-base">
										{format(targetDate, "dd/MM/yyyy", { locale: ptBR })}
									</Text>
								</Pressable>
							</TextField>
						)}

						{editItem && (
							<View className="mt-3 p-3 bg-surface-secondary/40 rounded-xl border border-surface-secondary">
								<Button
									variant={resetWear ? "primary" : "secondary"}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										const nextReset = !resetWear;
										setResetWear(nextReset);
										if (nextReset) {
											setLastDate(new Date());
											if (
												type === "date" &&
												editItem.targetDate &&
												editItem.lastMaintenanceDate
											) {
												const prevDuration = differenceInDays(
													editItem.targetDate,
													editItem.lastMaintenanceDate,
												);
												const durationToUse =
													prevDuration > 0 ? prevDuration : 30;
												setTargetDate(addDays(new Date(), durationToUse));
											}
										}
									}}
								>
									<Button.Label>
										{resetWear
											? "✓ Revisão marcada como feita (Zerar desgaste)"
											: "Marcar revisão/troca como realizada hoje"}
									</Button.Label>
								</Button>
								{type === "date" && resetWear && (
									<Text className="text-xs text-muted mt-2 text-center">
										Nova data de vencimento calculada automaticamente. Altere
										abaixo se desejar.
									</Text>
								)}
							</View>
						)}

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
							<Button variant="primary" className="flex-1" onPress={handleSave}>
								<Button.Label>{editItem ? "Salvar" : "Adicionar"}</Button.Label>
							</Button>
						</View>
					</ScrollView>
				</BottomSheet.Content>
			</BottomSheet.Portal>
			{showTargetDatePicker && (
				<DateTimePicker
					value={targetDate}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeTargetDate}
					onDismiss={() => setShowTargetDatePicker(false)}
				/>
			)}
			{showLastDatePicker && (
				<DateTimePicker
					value={lastDate}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeLastDate}
					onDismiss={() => setShowLastDatePicker(false)}
				/>
			)}
		</BottomSheet>
	);
}
