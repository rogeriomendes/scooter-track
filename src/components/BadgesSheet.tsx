import { Button } from "heroui-native/button";
import { ScrollView, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import {
	StyledIcon,
	type StyledIcon as StyledIconName,
} from "@/components/StyledIcon";
import type { Badge } from "@/hooks/useBadges";

interface BadgesSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	badges: Badge[];
	unlockedCount: number;
	totalCount: number;
	co2SavedKg: number;
}

const BADGE_COLORS: Record<string, { icon: string; bg: string }> = {
	"text-success": { icon: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
	"text-lime-400": { icon: "#a3e635", bg: "rgba(163, 230, 53, 0.15)" },
	"text-info": { icon: "#0ea5e9", bg: "rgba(14, 165, 233, 0.15)" },
	"text-warning": { icon: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
	"text-amber-400": { icon: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)" },
	"text-amber-500": { icon: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
	"text-purple-400": { icon: "#c084fc", bg: "rgba(192, 132, 252, 0.15)" },
	"text-cyan-400": { icon: "#22d3ee", bg: "rgba(34, 211, 238, 0.15)" },
	"text-indigo-400": { icon: "#818cf8", bg: "rgba(129, 140, 248, 0.15)" },
	"text-blue-400": { icon: "#60a5fa", bg: "rgba(96, 165, 250, 0.15)" },
	"text-emerald-500": { icon: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
	"text-emerald-400": { icon: "#34d399", bg: "rgba(52, 211, 153, 0.15)" },
	"text-sky-400": { icon: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" },
	"text-teal-400": { icon: "#2dd4bf", bg: "rgba(45, 212, 191, 0.15)" },
	"text-rose-400": { icon: "#fb7185", bg: "rgba(251, 113, 133, 0.15)" },
};

export function BadgesSheet({
	isOpen,
	onOpenChange,
	badges,
	unlockedCount,
	totalCount,
	co2SavedKg,
}: BadgesSheetProps) {
	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Conquistas & Badges"
		>
			<View className="gap-3">
				{/* RESUMO DE PROGRESSO */}
				<View className="bg-surface-secondary p-3.5 rounded-2xl flex-row items-center justify-between">
					<View className="flex-1">
						<Text className="text-xs font-bold text-muted uppercase tracking-wider">
							Desbloqueadas
						</Text>
						<Text className="text-xl font-black text-foreground">
							{unlockedCount}{" "}
							<Text className="text-xs font-bold text-muted">
								de {totalCount} insígnias
							</Text>
						</Text>
					</View>

					<View className="bg-success/10 px-3 py-1.5 rounded-xl border border-success/20 items-end">
						<Text className="text-[10px] font-bold text-success uppercase">
							Impacto Ecológico
						</Text>
						<Text className="text-sm font-black text-success">
							-{co2SavedKg.toFixed(1)} kg CO₂
						</Text>
					</View>
				</View>

				{/* LISTA DE INSÍGNIAS */}
				<ScrollView
					className="max-h-[420px]"
					showsVerticalScrollIndicator={false}
					contentContainerClassName="gap-2.5 pb-2"
				>
					{badges.map((badge) => {
						const colorConfig = BADGE_COLORS[badge.color] ?? {
							icon: "#10b981",
							bg: "rgba(16, 185, 129, 0.15)",
						};

						return (
							<View
								key={badge.id}
								className={`p-3 rounded-2xl border flex-row items-center gap-3 ${
									badge.isUnlocked
										? "bg-surface border-surface-secondary shadow-sm"
										: "bg-surface-secondary border-transparent opacity-60"
								}`}
							>
								<View
									className={`w-10 h-10 rounded-xl items-center justify-center ${
										badge.isUnlocked ? "" : "bg-surface-tertiary"
									}`}
									style={
										badge.isUnlocked
											? { backgroundColor: colorConfig.bg }
											: undefined
									}
								>
									<StyledIcon
										name={badge.icon as StyledIconName}
										size={20}
										color={badge.isUnlocked ? colorConfig.icon : undefined}
										className={badge.isUnlocked ? undefined : "text-muted"}
									/>
								</View>

								<View className="flex-1 min-w-0">
									<View className="flex-row items-center justify-between">
										<Text
											className={`text-sm font-bold ${
												badge.isUnlocked ? "text-foreground" : "text-muted"
											}`}
											numberOfLines={1}
										>
											{badge.title}
										</Text>
										<Text className="text-[10px] font-bold text-muted">
											{badge.progressText}
										</Text>
									</View>

									<Text
										className="text-xs text-muted leading-4 mt-0.5"
										numberOfLines={2}
									>
										{badge.description}
									</Text>

									{/* BARRA DE PROGRESSO */}
									{!badge.isUnlocked && (
										<View className="w-full h-1.5 bg-surface-tertiary rounded-full mt-2 overflow-hidden">
											<View
												className="h-full bg-success/60 rounded-full"
												style={{
													width: `${Math.max(5, badge.progress * 100)}%`,
												}}
											/>
										</View>
									)}
								</View>
							</View>
						);
					})}
				</ScrollView>

				<Button
					variant="secondary"
					className="mt-1"
					onPress={() => onOpenChange(false)}
				>
					<Button.Label>Fechar</Button.Label>
				</Button>
			</View>
		</AppBottomSheet>
	);
}
