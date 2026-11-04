import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export type ViewMode = "day" | "cycle";
export type Timeframe = "7d" | "30d" | "month" | "all";

export interface ReportFiltersProps {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	timeframe: Timeframe;
	onTimeframeChange: (tf: Timeframe) => void;
}

const timeframeOptions: { id: Timeframe; label: string }[] = [
	{ id: "7d", label: "7D" },
	{ id: "30d", label: "30D" },
	{ id: "month", label: "Mês" },
	{ id: "all", label: "Tudo" },
];

export function ReportFilters({
	viewMode,
	onViewModeChange,
	timeframe,
	onTimeframeChange,
}: ReportFiltersProps) {
	return (
		<View className="pt-1 mb-2.5 gap-2.5">
			{/* TOGGLE SEGMENTADO */}
			<View className="flex-row bg-surface-tertiary p-1.5 rounded-2xl">
				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onViewModeChange("day");
					}}
					className={`flex-1 h-10 rounded-xl flex-row justify-center items-center gap-2 ${
						viewMode === "day" ? "bg-surface shadow-sm" : "active:opacity-70"
					}`}
				>
					<StyledIcon
						name="calendar"
						size={18}
						className={viewMode === "day" ? "text-success" : "text-muted"}
					/>
					<Text
						className={`text-sm font-bold ${
							viewMode === "day" ? "text-foreground" : "text-muted"
						}`}
					>
						Por Dia
					</Text>
				</Pressable>

				<Pressable
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onViewModeChange("cycle");
					}}
					className={`flex-1 h-10 rounded-xl flex-row justify-center items-center gap-2 ${
						viewMode === "cycle" ? "bg-surface shadow-sm" : "active:opacity-70"
					}`}
				>
					<StyledIcon
						name="zap"
						size={18}
						className={viewMode === "cycle" ? "text-success" : "text-muted"}
					/>
					<Text
						className={`text-sm font-bold ${
							viewMode === "cycle" ? "text-foreground" : "text-muted"
						}`}
					>
						Por Ciclo
					</Text>
				</Pressable>
			</View>

			{/* SELETOR DE PERÍODO */}
			<View className="flex-row items-center justify-between px-1">
				<Text className="text-sm font-bold text-muted uppercase tracking-wider">
					Período
				</Text>
				<View className="flex-row gap-1 bg-surface-tertiary p-1 rounded-xl">
					{timeframeOptions.map((t) => (
						<Pressable
							key={t.id}
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								onTimeframeChange(t.id);
							}}
							className={`px-3 py-1 rounded-lg ${
								timeframe === t.id
									? "bg-surface shadow-sm"
									: "active:opacity-70"
							}`}
						>
							<Text
								className={`text-xs font-bold ${
									timeframe === t.id ? "text-success" : "text-muted"
								}`}
							>
								{t.label}
							</Text>
						</Pressable>
					))}
				</View>
			</View>
		</View>
	);
}
