import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { maintenance, type scooters } from "@/db/schema";
import DateTimePicker, {
	type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { addDays, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

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

	const isReadOnly = Boolean(editItem?.isCompleted);

	const handleReopen = async () => {
		if (!editItem) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await db
			.update(maintenance)
			.set({ isCompleted: false })
			.where(eq(maintenance.id, editItem.id));
		onOpenChange(false);
		onSaved();
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
			isCompleted: resetWear || (editItem ? Boolean(editItem.isCompleted) : false),
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
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				isReadOnly
					? "Detalhes da Manutenção"
					: editItem
						? "Editar Manutenção"
						: "Adicionar Peça/Serviço"
			}
		>
			{isReadOnly && (
				<View className="bg-success/15 border border-success/30 p-3 rounded-2xl flex-row items-center mb-3 gap-3">
					<View className="w-8 h-8 rounded-xl bg-success/20 items-center justify-center">
						<StyledIcon
							name="check-circle"
							size={18}
							className="text-success"
						/>
					</View>
					<View className="flex-1">
						<Text className="text-success font-bold text-xs">
							Manutenção Concluída
						</Text>
						<Text className="text-muted text-[11px] font-medium">
							Esta manutenção já foi realizada. As informações estão em modo de visualização.
						</Text>
					</View>
				</View>
			)}

			<TextField>
				<Label>Nome da Peça/Serviço</Label>
				<BottomSheetInput
					placeholder="Ex: Pastilha de freio traseira"
					value={name}
					onChangeText={setName}
					editable={!isReadOnly}
					variant="secondary"
				/>
			</TextField>

			<View className="my-2">
				<Label className="mb-2">Tipo de Controle</Label>
				<View className="flex-row flex-wrap gap-2">
					<Button
						size="sm"
						variant={type === "km" ? "primary" : "secondary"}
						isDisabled={isReadOnly}
						onPress={() => !isReadOnly && setType("km")}
					>
						<Button.Label>Por KM</Button.Label>
					</Button>
					<Button
						size="sm"
						variant={type === "months" ? "primary" : "secondary"}
						isDisabled={isReadOnly}
						onPress={() => !isReadOnly && setType("months")}
					>
						<Button.Label>Por Meses</Button.Label>
					</Button>
					<Button
						size="sm"
						variant={type === "date" ? "primary" : "secondary"}
						isDisabled={isReadOnly}
						onPress={() => !isReadOnly && setType("date")}
					>
						<Button.Label>Data Fixa</Button.Label>
					</Button>
					<Button
						size="sm"
						variant={type === "mixed" ? "primary" : "secondary"}
						isDisabled={isReadOnly}
						onPress={() => !isReadOnly && setType("mixed")}
					>
						<Button.Label>Misto</Button.Label>
					</Button>
				</View>
			</View>

			{type === "km" && (
				<TextField>
					<Label>Intervalo de Troca (KM)</Label>
					<BottomSheetInput
						placeholder="Ex: 1000"
						keyboardType="numeric"
						value={intervalKm}
						onChangeText={setIntervalKm}
						editable={!isReadOnly}
						variant="secondary"
					/>
				</TextField>
			)}

			{type === "months" && (
				<View className="flex-row gap-3">
					<View className="flex-1">
						<TextField>
							<Label>Intervalo (Meses)</Label>
							<BottomSheetInput
								placeholder="Ex: 6"
								keyboardType="numeric"
								value={intervalMonths}
								onChangeText={setIntervalMonths}
								editable={!isReadOnly}
								variant="secondary"
							/>
						</TextField>
					</View>
					<View className="flex-1">
						<TextField>
							<Label>Data de Início</Label>
							<Pressable
								onPress={() => !isReadOnly && setShowLastDatePicker(true)}
								className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
							>
								<Text className="text-foreground text-sm">
									{format(lastDate, "dd/MM/yyyy", { locale: ptBR })}
								</Text>
								<StyledIcon name="calendar" size={16} className="text-muted" />
							</Pressable>
						</TextField>
					</View>
				</View>
			)}

			{type === "date" && (
				<View className="flex-row gap-3">
					<View className="flex-1">
						<TextField>
							<Label>Data de Início</Label>
							<Pressable
								onPress={() => !isReadOnly && setShowLastDatePicker(true)}
								className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
							>
								<Text className="text-foreground text-sm">
									{format(lastDate, "dd/MM/yyyy", { locale: ptBR })}
								</Text>
								<StyledIcon name="calendar" size={16} className="text-muted" />
							</Pressable>
						</TextField>
					</View>
					<View className="flex-1">
						<TextField>
							<Label>Data Vencimento</Label>
							<Pressable
								onPress={() => !isReadOnly && setShowTargetDatePicker(true)}
								className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
							>
								<Text className="text-foreground text-sm">
									{format(targetDate, "dd/MM/yyyy", { locale: ptBR })}
								</Text>
								<StyledIcon name="calendar" size={16} className="text-muted" />
							</Pressable>
						</TextField>
					</View>
				</View>
			)}

			{type === "mixed" && (
				<View className="gap-3">
					<View className="flex-row gap-3">
						<View className="flex-1">
							<TextField>
								<Label>Intervalo (KM)</Label>
								<BottomSheetInput
									placeholder="Ex: 1000"
									keyboardType="numeric"
									value={intervalKm}
									onChangeText={setIntervalKm}
									editable={!isReadOnly}
									variant="secondary"
								/>
							</TextField>
						</View>
						<View className="flex-1">
							<TextField>
								<Label>Data de Início</Label>
								<Pressable
									onPress={() => !isReadOnly && setShowLastDatePicker(true)}
									className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
								>
									<Text className="text-foreground text-sm">
										{format(lastDate, "dd/MM/yyyy", { locale: ptBR })}
									</Text>
									<StyledIcon
										name="calendar"
										size={16}
										className="text-muted"
									/>
								</Pressable>
							</TextField>
						</View>
					</View>

					<TextField>
						<Label>Intervalo (Meses)</Label>
						<BottomSheetInput
							placeholder="Ex: 6"
							keyboardType="numeric"
							value={intervalMonths}
							onChangeText={setIntervalMonths}
							editable={!isReadOnly}
							variant="secondary"
						/>
					</TextField>
				</View>
			)}

			{editItem && !isReadOnly && (
				<View className="mt-3 bg-surface-secondary/40 rounded-xl border border-surface-secondary">
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
									const durationToUse = prevDuration > 0 ? prevDuration : 30;
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
							Nova data de vencimento calculada automaticamente. Altere abaixo
							se desejar.
						</Text>
					)}
				</View>
			)}

			{isReadOnly ? (
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
						variant="secondary"
						className="flex-1"
						onPress={handleReopen}
					>
						<Button.Label className="text-foreground">
							Reabrir Manutenção
						</Button.Label>
					</Button>
				</View>
			) : (
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
			)}

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
		</AppBottomSheet>
	);
}
