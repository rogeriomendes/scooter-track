import { Card } from "heroui-native/card";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import { BatteryConfigsSheet } from "./BatteryConfigsSheet";

export function BatteryConfigsSection() {
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	return (
		<>
			<Card
				variant="default"
				className="mb-6 bg-surface border border-border shadow-sm rounded-2xl overflow-hidden p-0"
			>
				<Pressable
					onPress={() => setIsSheetOpen(true)}
					className="p-4 flex-row items-center justify-between active:bg-surface-secondary/40"
				>
					<View className="flex-row items-center gap-3 flex-1">
						<View className="w-10 h-10 rounded-xl bg-success/15 items-center justify-center">
							<StyledIcon name="zap" size={20} color="#10b981" />
						</View>
						<View className="flex-1">
							<Text className="text-sm font-bold text-foreground">
								Tabela de Voltagens
							</Text>
							<Text className="text-xs text-muted mt-0.5">
								Gerenciar ou adicionar voltagens
							</Text>
						</View>
					</View>

					<StyledIcon name="chevron-right" size={18} className="text-muted" />
				</Pressable>
			</Card>

			<BatteryConfigsSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
		</>
	);
}
