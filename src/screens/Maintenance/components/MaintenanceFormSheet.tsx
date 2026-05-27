import { BottomSheetInput } from "@/components/BottomSheetInput";
import { db } from "@/db/client";
import { maintenance, type scooters } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

interface MaintenanceFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	scooter: typeof scooters.$inferSelect;
	editItem?: typeof maintenance.$inferSelect | null;
	currentTotalKm: number;
}

export function MaintenanceFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	scooter,
	editItem,
	currentTotalKm,
}: MaintenanceFormSheetProps) {
	const [name, setName] = useState("");
	const [intervalKm, setIntervalKm] = useState("");
	const [resetWear, setResetWear] = useState(false);

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setIntervalKm(editItem.intervalKm.toString());
				setResetWear(false);
			} else {
				setName("");
				setIntervalKm("");
				setResetWear(false);
			}
		}
	}, [isOpen, editItem]);

	const handleSave = async () => {
		if (!name || !intervalKm) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(maintenance)
				.set({
					name,
					intervalKm: parseFloat(intervalKm),
					...(resetWear ? { lastMaintenanceKm: currentTotalKm } : {}),
				})
				.where(eq(maintenance.id, editItem.id));
		} else {
			await db.insert(maintenance).values({
				scooterId: scooter.id,
				name,
				intervalKm: parseFloat(intervalKm),
				lastMaintenanceKm: currentTotalKm,
				createdAt: new Date(),
			});
		}

		setName("");
		setIntervalKm("");
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
					className="gap-4"
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Manutenção" : "Adicionar Peça"}
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

					{editItem && (
						<Button
							variant={resetWear ? "primary" : "secondary"}
							className="mt-2"
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								setResetWear(!resetWear);
							}}
						>
							<Button.Label>
								{resetWear
									? "Desgaste será zerado"
									: "Troquei esta peça agora (Zerar desgaste)"}
							</Button.Label>
						</Button>
					)}

					<Button variant="primary" className="mt-4" onPress={handleSave}>
						<Button.Label>
							{editItem ? "Salvar Alterações" : "Adicionar"}
						</Button.Label>
					</Button>
				</BottomSheet.Content>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
