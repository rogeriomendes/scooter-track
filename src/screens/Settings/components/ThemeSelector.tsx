import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { ThemeType } from "@/store/useAppStore";

interface ThemeSelectorProps {
	currentTheme: ThemeType;
	onSelectTheme: (theme: ThemeType) => void;
}

const THEME_OPTIONS: Array<{
	id: ThemeType;
	label: string;
	icon: React.ComponentProps<typeof StyledIcon>["name"];
	activeBorder: string;
	activeBg: string;
	activeIconBg: string;
	activeDot: string;
	iconColor: string;
}> = [
	{
		id: "light",
		label: "Claro",
		icon: "sun",
		activeBorder: "border-warning/50",
		activeBg: "bg-warning/10",
		activeIconBg: "bg-warning/20",
		activeDot: "bg-warning",
		iconColor: "text-warning",
	},
	{
		id: "dark",
		label: "Escuro",
		icon: "moon",
		activeBorder: "border-info/50",
		activeBg: "bg-info/10",
		activeIconBg: "bg-info/20",
		activeDot: "bg-info",
		iconColor: "text-info",
	},
	{
		id: "system",
		label: "Sistema",
		icon: "monitor",
		activeBorder: "border-success/50",
		activeBg: "bg-success/10",
		activeIconBg: "bg-success/20",
		activeDot: "bg-success",
		iconColor: "text-success",
	},
];

export function ThemeSelector({
	currentTheme,
	onSelectTheme,
}: ThemeSelectorProps) {
	return (
		<View className="flex-row gap-2.5 mb-6">
			{THEME_OPTIONS.map((opt) => {
				const isSelected = currentTheme === opt.id;
				return (
					<Pressable
						key={opt.id}
						onPress={() => {
							onSelectTheme(opt.id);
							Haptics.selectionAsync();
						}}
						className={`flex-1 p-3 rounded-2xl border flex-col items-center justify-between gap-2 ${
							isSelected
								? `${opt.activeBg} ${opt.activeBorder} shadow-sm`
								: "bg-surface border-surface-secondary/70"
						}`}
					>
						<View
							className={`w-9 h-9 rounded-xl items-center justify-center ${
								isSelected ? opt.activeIconBg : "bg-surface-secondary/50"
							}`}
						>
							<StyledIcon
								name={opt.icon}
								size={18}
								className={isSelected ? opt.iconColor : "text-muted"}
							/>
						</View>
						<Text
							className={`text-xs font-bold ${
								isSelected ? "text-foreground" : "text-muted"
							}`}
						>
							{opt.label}
						</Text>
						{isSelected ? (
							<View className={`w-1.5 h-1.5 rounded-full ${opt.activeDot}`} />
						) : (
							<View className="w-1.5 h-1.5" />
						)}
					</Pressable>
				);
			})}
		</View>
	);
}
