import { Button } from "heroui-native/button";
import { View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export interface FloatingActionPillProps {
	label: string;
	icon?: StyledIcon;
	onPress: () => void;
}

export function FloatingActionPill({
	label,
	icon = "plus",
	onPress,
}: FloatingActionPillProps) {
	return (
		<View className="absolute bottom-6 left-0 right-0 items-center z-20 pointer-events-box-none">
			<Button
				size="md"
				variant="primary"
				className="rounded-full shadow-md px-5 py-3 flex-row items-center gap-2"
				onPress={onPress}
			>
				<StyledIcon name={icon} size={18} className="text-white" />
				<Button.Label className="text-white font-bold">{label}</Button.Label>
			</Button>
		</View>
	);
}
