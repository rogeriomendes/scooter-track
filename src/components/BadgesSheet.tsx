import { Button } from "heroui-native/button";
import { ScrollView, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { StyledIcon } from "@/components/StyledIcon";
import type { Badge } from "@/hooks/useBadges";

interface BadgesSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	badges: Badge[];
	unlockedCount: number;
	totalCount: number;
	co2SavedKg: number;
}

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
			<View className="gap-3 max-h-[500px]">
				{/* RESUMO DE PROGRESSO */}
				<View className="bg-surface-secondary/40 p-3.5 rounded-2xl border border-surface-secondary/60 flex-row items-center justify-between">
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
					className="max-h-[360px]"
					contentContainerClassName="gap-2.5"
				>
					{badges.map((badge) => (
						<View
							key={badge.id}
							className={`p-3 rounded-2xl border flex-row items-center gap-3 ${
								badge.isUnlocked
									? "bg-surface border-surface-secondary shadow-sm"
									: "bg-surface-secondary/20 border-surface-secondary/40 opacity-60"
							}`}
						>
							<View
								className={`w-10 h-10 rounded-xl items-center justify-center ${
									badge.isUnlocked ? "bg-success/15" : "bg-surface-tertiary"
								}`}
							>
								<StyledIcon
									name={badge.icon as any}
									size={20}
									className={badge.isUnlocked ? badge.color : "text-muted"}
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
											style={{ width: `${Math.max(5, badge.progress * 100)}%` }}
										/>
									</View>
								)}
							</View>
						</View>
					))}
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
