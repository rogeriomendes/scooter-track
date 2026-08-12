import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import type { scooters } from "@/db/schema";

interface RangeCalculatorSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	scooter: typeof scooters.$inferSelect;
	currentBatteryPercent: number;
	estimatedAutonomyKm: number;
}

export function RangeCalculatorSheet({
	isOpen,
	onOpenChange,
	scooter,
	currentBatteryPercent,
	estimatedAutonomyKm,
}: RangeCalculatorSheetProps) {
	const [targetDistance, setTargetDistance] = useState("");

	const autonomyToUse =
		estimatedAutonomyKm > 0
			? estimatedAutonomyKm
			: scooter.autonomyGoal > 0
				? scooter.autonomyGoal
				: 30; // fallback 30 km

	// Calculate remaining range with current battery
	const maxKmCurrentBattery = (currentBatteryPercent / 100) * autonomyToUse;

	const calculation = useMemo(() => {
		const dist = parseFloat(targetDistance);
		if (Number.isNaN(dist) || dist <= 0) return null;

		// Estimated battery required for this distance
		const requiredPercent = (dist / autonomyToUse) * 100;
		const remainingPercent = currentBatteryPercent - requiredPercent;

		let status: "ok" | "warning" | "danger" = "ok";
		let message = "";

		if (remainingPercent >= 15) {
			status = "ok";
			message = `Bateria suficiente com margem de segurança de ~${((remainingPercent / 100) * autonomyToUse).toFixed(1)} km.`;
		} else if (remainingPercent >= 0) {
			status = "warning";
			message = `Carga limite! Chegará com ~${remainingPercent.toFixed(0)}% de bateria. Considere carregar em breve.`;
		} else {
			status = "danger";
			message = `Atenção: Carga insuficiente. Faltarão cerca de ${Math.abs((remainingPercent / 100) * autonomyToUse).toFixed(1)} km para concluir o percurso.`;
		}

		return {
			dist,
			requiredPercent,
			remainingPercent,
			status,
			message,
		};
	}, [targetDistance, currentBatteryPercent, autonomyToUse]);

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Calculadora de Alcance"
		>
			<View className="gap-3">
				{/* STATUS ATUAL DA BATERIA */}
				<View className="bg-surface-secondary/40 p-3.5 rounded-2xl border border-surface-secondary/60 flex-row items-center gap-3">
					<View className="w-10 h-10 rounded-xl bg-success/15 items-center justify-center">
						<StyledIcon name="zap" size={20} className="text-success" />
					</View>
					<View className="flex-1">
						<Text className="text-xs font-bold text-muted uppercase tracking-wider">
							Bateria Atual
						</Text>
						<Text className="text-lg font-black text-foreground">
							{currentBatteryPercent.toFixed(0)}%{" "}
							<Text className="text-xs font-bold text-muted">
								(~{maxKmCurrentBattery.toFixed(1)} km disponíveis)
							</Text>
						</Text>
					</View>
				</View>

				{/* INPUT DE DISTÂNCIA */}
				<TextField>
					<Label>Distância da Viagem Desejada (km)</Label>
					<BottomSheetInput
						placeholder="Ex: 12.5"
						keyboardType="numeric"
						value={targetDistance}
						onChangeText={(text) => {
							setTargetDistance(text);
						}}
						variant="secondary"
					/>
				</TextField>

				{/* DIAGNÓSTICO / RESULTADO */}
				{calculation && (
					<View
						className={`p-4 rounded-2xl border ${
							calculation.status === "ok"
								? "bg-success/10 border-success/30"
								: calculation.status === "warning"
									? "bg-warning/10 border-warning/30"
									: "bg-danger/10 border-danger/30"
						}`}
					>
						<View className="flex-row items-center gap-2 mb-1.5">
							<StyledIcon
								name={
									calculation.status === "ok"
										? "check-circle"
										: calculation.status === "warning"
											? "alert-triangle"
											: "alert-circle"
								}
								size={18}
								className={
									calculation.status === "ok"
										? "text-success"
										: calculation.status === "warning"
											? "text-warning"
											: "text-danger"
								}
							/>
							<Text
								className={`text-sm font-black uppercase tracking-wider ${
									calculation.status === "ok"
										? "text-success"
										: calculation.status === "warning"
											? "text-warning"
											: "text-danger"
								}`}
							>
								{calculation.status === "ok"
									? "Carga Ok"
									: calculation.status === "warning"
										? "Carga Limite"
										: "Bateria Insuficiente"}
							</Text>
						</View>

						<Text className="text-xs text-foreground leading-4 font-semibold">
							{calculation.message}
						</Text>

						<View className="mt-3 pt-2.5 border-t border-surface-secondary/40 flex-row justify-between">
							<View>
								<Text className="text-[10px] font-bold text-muted uppercase">
									Consumo Estimado
								</Text>
								<Text className="text-sm font-black text-foreground">
									~{calculation.requiredPercent.toFixed(0)}%
								</Text>
							</View>
							<View className="items-end">
								<Text className="text-[10px] font-bold text-muted uppercase">
									Bateria Final Estimada
								</Text>
								<Text
									className={`text-sm font-black ${
										calculation.remainingPercent < 0
											? "text-danger"
											: "text-foreground"
									}`}
								>
									{calculation.remainingPercent > 0
										? `~${calculation.remainingPercent.toFixed(0)}%`
										: "0% (Descarga total)"}
								</Text>
							</View>
						</View>
					</View>
				)}

				<Button
					variant="primary"
					className="mt-2"
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onOpenChange(false);
					}}
				>
					<Button.Label>Entendido</Button.Label>
				</Button>
			</View>
		</AppBottomSheet>
	);
}
