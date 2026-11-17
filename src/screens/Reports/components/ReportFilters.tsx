import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

export type Timeframe = "7d" | "30d" | "month" | "all";

export interface ReportFiltersProps {
	timeframe: Timeframe;
	onTimeframeChange: (tf: Timeframe) => void;
}

const timeframeOptions: { id: Timeframe; label: string }[] = [
	{ id: "7d", label: "7 Dias" },
	{ id: "30d", label: "30 Dias" },
	{ id: "month", label: "Este Mês" },
	{ id: "all", label: "Tudo" },
];

export function ReportFilters({
	timeframe,
	onTimeframeChange,
}: ReportFiltersProps) {
	return (
		<View className="mb-3">
			<View className="flex-row bg-surface-secondary/70 p-1 rounded-2xl border border-border/40">
				{timeframeOptions.map((t) => {
					const isSelected = timeframe === t.id;
					return (
						<Pressable
							key={t.id}
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								onTimeframeChange(t.id);
							}}
							className={`flex-1 h-9 rounded-xl items-center justify-center transition-all ${
								isSelected
									? "bg-surface shadow-sm border border-border"
									: "active:opacity-70"
							}`}
						>
							<Text
								className={`text-xs font-bold ${
									isSelected ? "text-success" : "text-muted"
								}`}
							>
								{t.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
