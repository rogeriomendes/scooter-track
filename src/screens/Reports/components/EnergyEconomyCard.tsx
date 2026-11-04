import { Card } from "heroui-native/card";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { EnergyStats } from "@/utils/energy";

interface EnergyEconomyCardProps {
	stats: EnergyStats;
	totalKm: number;
}

export function EnergyEconomyCard({ stats, totalKm }: EnergyEconomyCardProps) {
	if (totalKm <= 0) return null;

	return (
		<Card
			variant="default"
			className="mb-4 bg-surface border border-border shadow-sm p-4 rounded-2xl"
		>
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-2">
					<View className="w-7 h-7 rounded-lg bg-emerald-500/15 items-center justify-center">
						<StyledIcon name="zap" size={16} className="text-emerald-500" />
					</View>
					<Text className="text-sm font-bold text-foreground">
						Energia & Economia
					</Text>
				</View>
				<View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
					<Text className="text-[10px] font-bold text-emerald-500">
						Ecológico
					</Text>
				</View>
			</View>

			<View className="flex-row gap-2 mb-2.5">
				{/* Custo Total Energia */}
				<View className="flex-1 bg-surface-secondary/70 p-2.5 rounded-xl">
					<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
						Gasto Elétrico
					</Text>
					<Text className="text-base font-black text-foreground">
						R$ {stats.totalEnergyCost.toFixed(2)}
					</Text>
					<Text className="text-[10px] text-muted">
						{stats.totalKwhConsumed.toFixed(1)} kWh
					</Text>
				</View>

				{/* Custo por KM */}
				<View className="flex-1 bg-surface-secondary/70 p-2.5 rounded-xl">
					<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
						Custo por KM
					</Text>
					<Text className="text-base font-black text-foreground">
						R$ {stats.costPerKm.toFixed(3)}
					</Text>
					<Text className="text-[10px] text-muted">por quilômetro</Text>
				</View>
			</View>

			{/* Comparativo de Economia vs Gasolina */}
			<View className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex-row items-center justify-between">
				<View className="flex-1 pr-2">
					<Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
						Economia vs Gasolina
					</Text>
					<Text className="text-xs text-muted mt-0.5">
						Comparado a rodar a mesma distância de carro/combustível
					</Text>
				</View>
				<View className="items-end">
					<Text className="text-lg font-black text-emerald-500">
						+ R$ {stats.totalSavings.toFixed(2)}
					</Text>
					<Text className="text-[10px] font-bold text-muted">poupados</Text>
				</View>
			</View>
		</Card>
	);
}
