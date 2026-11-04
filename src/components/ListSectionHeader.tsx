import { Text, View } from "react-native";

export interface ListSectionHeaderProps {
	title: string;
	dotColor?: string;
}

export function ListSectionHeader({
	title,
	dotColor = "bg-success",
}: ListSectionHeaderProps) {
	return (
		<View className="bg-background/95 pb-1.5 flex-row items-center gap-1.5">
			<View className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
			<Text className="text-xs font-bold text-muted uppercase tracking-wider">
				{title}
			</Text>
		</View>
	);
}
