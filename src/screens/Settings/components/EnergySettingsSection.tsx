import * as Haptics from "expo-haptics";
import { Card } from "heroui-native/card";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import { useAppStore } from "@/store/useAppStore";

export function EnergySettingsSection() {
	const costPerKwh = useAppStore((s) => s.costPerKwh);
	const gasPricePerLiter = useAppStore((s) => s.gasPricePerLiter);
	const setCostPerKwh = useAppStore((s) => s.setCostPerKwh);
	const setGasPricePerLiter = useAppStore((s) => s.setGasPricePerLiter);

	const [kwhInput, setKwhInput] = useState(costPerKwh.toString());
	const [gasInput, setGasInput] = useState(gasPricePerLiter.toString());
	const [isSaved, setIsSaved] = useState(false);

	const handleSave = () => {
		const parsedKwh = parseFloat(kwhInput.replace(",", "."));
		const parsedGas = parseFloat(gasInput.replace(",", "."));

		if (Number.isNaN(parsedKwh) || parsedKwh < 0) {
			Alert.alert("Valor inválido", "Informe um valor de kWh válido.");
			return;
		}

		if (Number.isNaN(parsedGas) || parsedGas < 0) {
			Alert.alert(
				"Valor inválido",
				"Informe um valor de preço da gasolina válido.",
			);
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setCostPerKwh(parsedKwh);
		setGasPricePerLiter(parsedGas);
		setIsSaved(true);
		setTimeout(() => setIsSaved(false), 2000);
	};

	return (
		<Card
			variant="default"
			className="mb-6 bg-surface border border-border shadow-sm p-3.5 rounded-2xl"
		>
			<View className="flex-row items-center gap-2.5">
				{/* Campo kWh */}
				<View className="flex-1">
					<Text className="text-[11px] font-bold text-muted mb-1 ml-0.5">
						Custo kWh
					</Text>
					<View className="flex-row items-center bg-surface-secondary px-2.5 h-10 rounded-xl">
						<Text className="text-xs font-bold text-muted mr-1">R$</Text>
						<TextInput
							value={kwhInput}
							onChangeText={setKwhInput}
							keyboardType="numeric"
							placeholder="0.85"
							placeholderTextColor="#71717a"
							className="flex-1 text-foreground font-bold text-sm p-0"
						/>
					</View>
				</View>

				{/* Campo Gasolina */}
				<View className="flex-1">
					<Text className="text-[11px] font-bold text-muted mb-1 ml-0.5">
						Gasolina (L)
					</Text>
					<View className="flex-row items-center bg-surface-secondary px-2.5 h-10 rounded-xl">
						<Text className="text-xs font-bold text-muted mr-1">R$</Text>
						<TextInput
							value={gasInput}
							onChangeText={setGasInput}
							keyboardType="numeric"
							placeholder="5.90"
							placeholderTextColor="#71717a"
							className="flex-1 text-foreground font-bold text-sm p-0"
						/>
					</View>
				</View>

				{/* Botão de Salvar/Atualizar Compacto e Confiável */}
				<View className="self-end">
					<Pressable
						onPress={handleSave}
						className={`h-10 px-3.5 rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-80 shadow-sm ${
							isSaved ? "bg-emerald-600" : "bg-emerald-500"
						}`}
					>
						<StyledIcon
							name={isSaved ? "check" : "save"}
							size={15}
							color="#ffffff"
						/>
						<Text className="text-white font-bold text-xs">
							{isSaved ? "Salvo" : "Salvar"}
						</Text>
					</Pressable>
				</View>
			</View>
		</Card>
	);
}
