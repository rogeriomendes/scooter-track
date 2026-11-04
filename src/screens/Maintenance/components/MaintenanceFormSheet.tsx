import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { FormDateTimeField } from "@/components/FormDateTimeField";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { maintenance, type scooters } from "@/db/schema";
import { MaintenanceIntervalFields } from "./MaintenanceIntervalFields";
import { MaintenanceResetWearSection } from "./MaintenanceResetWearSection";

interface MaintenanceFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof maintenance.$inferSelect | null;
	currentTotalKm: number;
}

const CONTROL_TYPES: Array<{
	id: "km" | "months" | "date" | "mixed";
	label: string;
}> = [
	{ id: "km", label: "Por KM" },
	{ id: "months", label: "Por Meses" },
	{ id: "date", label: "Data Fixa" },
	{ id: "mixed", label: "Misto" },
];

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
	const [targetDate, setTargetDate] = useState(new Date());
	const [completedDate, setCompletedDate] = useState(new Date());
	const [resetWear, setResetWear] = useState(false);
	const [hasWear, setHasWear] = useState(true);

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setType(editItem.type as "km" | "months" | "date" | "mixed");
				setIntervalKm(
					editItem.intervalKm ? editItem.intervalKm.toString() : "",
				);
				setIntervalMonths(
					editItem.intervalMonths ? editItem.intervalMonths.toString() : "",
				);
				setLastDate(
					editItem.lastMaintenanceDate
						? new Date(editItem.lastMaintenanceDate)
						: new Date(),
				);
				setTargetDate(
					editItem.targetDate ? new Date(editItem.targetDate) : new Date(),
				);
				setCompletedDate(
					editItem.completedAt ? new Date(editItem.completedAt) : new Date(),
				);
				setHasWear(editItem.hasWear ?? true);
				setResetWear(false);
			} else {
				setName("");
				setType("km");
				setIntervalKm("");
				setIntervalMonths("");
				setLastDate(new Date());
				setTargetDate(new Date());
				setCompletedDate(new Date());
				setHasWear(true);
				setResetWear(false);
			}
		}
	}, [isOpen, editItem]);

	const isReadOnly = Boolean(editItem?.isCompleted);

	const handleCompletedDateChange = async (selectedDate: Date) => {
		setCompletedDate(selectedDate);
		if (editItem && isReadOnly) {
			await db
				.update(maintenance)
				.set({ completedAt: selectedDate })
				.where(eq(maintenance.id, editItem.id));
			onSaved();
		}
	};

	const handleToggleResetWear = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const nextReset = !resetWear;
		setResetWear(nextReset);
		if (nextReset) {
			setCompletedDate(new Date());
			if (type === "months" || type === "mixed") {
				setLastDate(new Date());
			}
		} else if (editItem) {
			setLastDate(
				editItem.lastMaintenanceDate
					? new Date(editItem.lastMaintenanceDate)
					: new Date(),
			);
			setTargetDate(
				editItem.targetDate ? new Date(editItem.targetDate) : new Date(),
			);
		}
	};

	const handleReopen = async () => {
		if (!editItem) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await db
			.update(maintenance)
			.set({ isCompleted: false, completedAt: null })
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
		const now = completedDate || new Date();

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
			lastMaintenanceKm:
				isResetting && (type === "km" || type === "mixed")
					? currentTotalKm
					: editItem
						? editItem.lastMaintenanceKm
						: currentTotalKm,
			lastMaintenanceDate:
				type === "date" || type === "months" || type === "mixed"
					? lastDate
					: editItem?.lastMaintenanceDate
						? new Date(editItem.lastMaintenanceDate)
						: now,
			isCompleted:
				type === "date"
					? resetWear || (editItem ? Boolean(editItem.isCompleted) : false)
					: false,
			completedAt: resetWear ? now : editItem?.completedAt || null,
			hasWear: hasWear,
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
						<FormDateTimeField
							value={completedDate}
							onChange={handleCompletedDateChange}
							renderTrigger={({ onPress, displayValue }) => (
								<Pressable
									onPress={onPress}
									className="flex-row items-center gap-1 mt-0.5 active:opacity-70"
								>
									<Text className="text-muted text-[11px] font-medium">
										Realizada em{" "}
										<Text className="text-foreground font-semibold underline">
											{displayValue}
										</Text>
									</Text>
									<StyledIcon name="edit-2" size={10} className="text-muted" />
								</Pressable>
							)}
						/>
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
					{CONTROL_TYPES.map((t) => (
						<Button
							key={t.id}
							size="sm"
							variant={type === t.id ? "primary" : "secondary"}
							isDisabled={isReadOnly}
							onPress={() => !isReadOnly && setType(t.id)}
						>
							<Button.Label>{t.label}</Button.Label>
						</Button>
					))}
				</View>
			</View>

			{/* TEM DESGASTE MECÂNICO / USO? */}
			<View className="mb-4 bg-surface-secondary/40 p-3.5 rounded-2xl border border-surface-secondary/60 flex-row items-center justify-between">
				<View className="flex-1 pr-3">
					<Text className="text-sm font-medium text-foreground">
						Possui desgaste pelo uso?
					</Text>
					<Text className="text-xs text-muted leading-4 mt-0.5">
						{hasWear
							? "Calcula o desgaste da peça com o uso (ex.: freios, pneus)."
							: "Item sem desgaste pelo uso (ex.: IPVA, licenciamento)."}
					</Text>
				</View>
				<Switch
					value={hasWear}
					onValueChange={(val) => {
						if (!isReadOnly) setHasWear(val);
					}}
					disabled={isReadOnly}
					trackColor={{ false: "#3f3f46", true: "#10b981" }}
					thumbColor="#ffffff"
				/>
			</View>

			<MaintenanceIntervalFields
				type={type}
				intervalKm={intervalKm}
				setIntervalKm={setIntervalKm}
				intervalMonths={intervalMonths}
				setIntervalMonths={setIntervalMonths}
				lastDate={lastDate}
				onChangeLastDate={setLastDate}
				targetDate={targetDate}
				onChangeTargetDate={setTargetDate}
				isReadOnly={isReadOnly}
			/>

			{editItem && !isReadOnly && (
				<MaintenanceResetWearSection
					resetWear={resetWear}
					onToggleResetWear={handleToggleResetWear}
					completedDate={completedDate}
					onChangeCompletedDate={setCompletedDate}
				/>
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
				{isReadOnly ? (
					<Button variant="secondary" className="flex-1" onPress={handleReopen}>
						<Button.Label className="text-foreground">
							Reabrir Manutenção
						</Button.Label>
					</Button>
				) : (
					<Button variant="primary" className="flex-1" onPress={handleSave}>
						<Button.Label>{editItem ? "Salvar" : "Adicionar"}</Button.Label>
					</Button>
				)}
			</View>
		</AppBottomSheet>
	);
}
