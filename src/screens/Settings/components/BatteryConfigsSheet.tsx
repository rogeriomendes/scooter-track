import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import {
	addCustomBatteryConfig,
	type BatteryConfig,
	deleteBatteryConfig,
	getBatteryConfigs,
	updateCustomBatteryConfig,
} from "@/constants/batteryCharts";

interface BatteryConfigsSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfigChanged?: () => void;
}

export function BatteryConfigsSheet({
	isOpen,
	onOpenChange,
	onConfigChanged,
}: BatteryConfigsSheetProps) {
	const [configs, setConfigs] = useState<BatteryConfig[]>([]);
	const [mode, setMode] = useState<"list" | "create" | "edit">("list");
	const [editingItem, setEditingItem] = useState<BatteryConfig | null>(null);

	// Formulário
	const [label, setLabel] = useState("");
	const [nominalVoltage, setNominalVoltage] = useState("");
	const [cells, setCells] = useState("");
	const [maxVoltage, setMaxVoltage] = useState("");
	const [minVoltage, setMinVoltage] = useState("");

	const loadConfigs = useCallback(async () => {
		const list = await getBatteryConfigs();
		setConfigs(list);
	}, []);

	useEffect(() => {
		if (isOpen) {
			loadConfigs();
			setMode("list");
			setEditingItem(null);
		}
	}, [isOpen, loadConfigs]);

	const resetForm = () => {
		setLabel("");
		setNominalVoltage("");
		setCells("");
		setMaxVoltage("");
		setMinVoltage("");
		setEditingItem(null);
		setMode("list");
	};

	const openCreate = () => {
		resetForm();
		setMode("create");
	};

	const openEdit = (item: BatteryConfig) => {
		if (item.isDefault) return;
		setEditingItem(item);
		setLabel(item.label);
		setNominalVoltage(item.nominalVoltage.toString());
		setCells(item.cells > 0 ? item.cells.toString() : "");
		setMaxVoltage(item.maxVoltage.toString());
		setMinVoltage(item.minVoltage.toString());
		setMode("edit");
	};

	const handleSave = async () => {
		const nomV = parseFloat(nominalVoltage.replace(",", "."));
		const maxV = parseFloat(maxVoltage.replace(",", "."));
		const minV = parseFloat(minVoltage.replace(",", "."));
		const numCells = parseInt(cells, 10) || 0;

		if (!label.trim()) {
			Alert.alert(
				"Erro",
				"Informe o nome/rótulo da voltagem (ex: 54V Custom).",
			);
			return;
		}

		if (
			Number.isNaN(nomV) ||
			Number.isNaN(maxV) ||
			Number.isNaN(minV) ||
			maxV <= minV
		) {
			Alert.alert(
				"Valores inválidos",
				"A voltagem máxima deve ser maior que a mínima e os campos devem ser numéricos.",
			);
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (mode === "edit" && editingItem) {
			await updateCustomBatteryConfig(editingItem.id, {
				label,
				nominalVoltage: nomV,
				cells: numCells,
				maxVoltage: maxV,
				minVoltage: minV,
			});
		} else {
			await addCustomBatteryConfig({
				label,
				nominalVoltage: nomV,
				cells: numCells,
				maxVoltage: maxV,
				minVoltage: minV,
			});
		}

		resetForm();
		await loadConfigs();
		onConfigChanged?.();
	};

	const handleDelete = (item: BatteryConfig) => {
		if (item.isDefault) {
			Alert.alert("Aviso", "As voltagens de fábrica não podem ser excluídas.");
			return;
		}

		Alert.alert(
			"Excluir Voltagem",
			`Deseja realmente remover a voltagem personalizada "${item.label}"?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Excluir",
					style: "destructive",
					onPress: async () => {
						await deleteBatteryConfig(item.id);
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
						await loadConfigs();
						onConfigChanged?.();
					},
				},
			],
		);
	};

	const getTitle = () => {
		if (mode === "create") return "Nova Voltagem Personalizada";
		if (mode === "edit") return "Editar Voltagem";
		return "Tabela de Voltagens";
	};

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={getTitle()}
			headerRight={
				mode === "list" ? (
					<Button
						size="sm"
						variant="primary"
						className="h-8 px-3 rounded-xl flex-row items-center gap-1.5"
						onPress={openCreate}
					>
						<StyledIcon name="plus" size={14} color="#ffffff" />
						<Button.Label className="text-white text-xs font-bold">
							Nova Voltagem
						</Button.Label>
					</Button>
				) : null
			}
		>
			{mode !== "list" ? (
				/* FORMULÁRIO DE ADIÇÃO / EDIÇÃO */
				<View className="gap-3 mb-2">
					<TextField className="w-full">
						<Label>Nome / Rótulo</Label>
						<BottomSheetInput
							value={label}
							onChangeText={setLabel}
							placeholder="Ex: 54V (15S Custom)"
							variant="secondary"
						/>
					</TextField>

					<View className="flex-row gap-3">
						<TextField className="flex-1">
							<Label>Volts Nominal</Label>
							<BottomSheetInput
								value={nominalVoltage}
								onChangeText={setNominalVoltage}
								keyboardType="numeric"
								placeholder="54"
								variant="secondary"
							/>
						</TextField>

						<TextField className="flex-1">
							<Label>Nº Células (S)</Label>
							<BottomSheetInput
								value={cells}
								onChangeText={setCells}
								keyboardType="numeric"
								placeholder="15"
								variant="secondary"
							/>
						</TextField>
					</View>

					<View className="flex-row gap-3">
						<TextField className="flex-1">
							<Label>100% (V Máx)</Label>
							<BottomSheetInput
								value={maxVoltage}
								onChangeText={setMaxVoltage}
								keyboardType="numeric"
								placeholder="63.0"
								variant="secondary"
							/>
						</TextField>

						<TextField className="flex-1">
							<Label>0% (V Mín)</Label>
							<BottomSheetInput
								value={minVoltage}
								onChangeText={setMinVoltage}
								keyboardType="numeric"
								placeholder="45.0"
								variant="secondary"
							/>
						</TextField>
					</View>

					<View className="flex-row gap-2.5 mt-2">
						<Button
							variant="outline"
							className="flex-1 border-surface-secondary"
							onPress={resetForm}
						>
							<Button.Label>Cancelar</Button.Label>
						</Button>

						<Button variant="primary" className="flex-1" onPress={handleSave}>
							<Button.Label>
								{mode === "edit" ? "Salvar Alterações" : "Salvar"}
							</Button.Label>
						</Button>
					</View>
				</View>
			) : (
				/* LISTAGEM DE VOLTAGENS */
				<View className="gap-2">
					<ScrollView
						className="max-h-[410px]"
						showsVerticalScrollIndicator={false}
						contentContainerClassName="gap-2 pb-2"
					>
						{configs.map((item) => (
							<View
								key={item.key}
								className="flex-row items-center justify-between p-3 rounded-xl bg-surface-secondary/60 border border-border/40"
							>
								<View className="flex-1 pr-2">
									<View className="flex-row items-center gap-2">
										<Text className="text-sm font-bold text-foreground">
											{item.label}
										</Text>
										<View
											className={`px-2 py-0.5 rounded-full border ${
												item.isDefault
													? "bg-info/10 border-info/30"
													: "bg-success/10 border-success/30"
											}`}
										>
											<Text
												className={`text-[10px] font-bold ${
													item.isDefault
														? "text-info dark:text-sky-400"
														: "text-success dark:text-emerald-400"
												}`}
											>
												{item.isDefault ? "Padrão" : "Personalizada"}
											</Text>
										</View>
									</View>
									<Text className="text-xs text-muted mt-1">
										{item.nominalVoltage}V
										{item.cells > 0 ? ` (${item.cells}S)` : ""} •{" "}
										{item.minVoltage}V a {item.maxVoltage}V
									</Text>
								</View>

								{!item.isDefault && (
									<View className="flex-row items-center gap-1">
										<Pressable
											onPress={() => openEdit(item)}
											className="p-2 rounded-lg bg-surface active:bg-surface-secondary"
											hitSlop={8}
										>
											<StyledIcon
												name="edit-2"
												size={14}
												className="text-foreground"
											/>
										</Pressable>

										<Pressable
											onPress={() => handleDelete(item)}
											className="p-2 rounded-lg bg-danger/10 active:bg-danger/20"
											hitSlop={8}
										>
											<StyledIcon
												name="trash-2"
												size={14}
												className="text-danger"
											/>
										</Pressable>
									</View>
								)}
							</View>
						))}
					</ScrollView>
				</View>
			)}
		</AppBottomSheet>
	);
}
