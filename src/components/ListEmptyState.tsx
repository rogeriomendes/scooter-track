import { Button } from "heroui-native/button";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export interface ListEmptyStateProps {
	icon: StyledIcon;
	title: string;
	description: string;
	buttonLabel?: string;
	onButtonPress?: () => void;
	buttonColor?: string;
	isFiltered?: boolean;
}

export function ListEmptyState({
	icon,
	title,
	description,
	buttonLabel,
	onButtonPress,
	buttonColor = "text-success",
	isFiltered = false,
}: ListEmptyStateProps) {
	if (isFiltered) {
		return (
			<View className="items-center justify-center mt-8 px-6">
				<View className="bg-surface-secondary/60 p-4 rounded-full mb-3 border border-surface-secondary">
					<StyledIcon name={icon} size={32} className="text-muted" />
				</View>
				<Text className="text-foreground text-center text-base font-bold capitalize">
					{title}
				</Text>
				<Text className="text-muted text-center text-xs mt-1 px-4 leading-4">
					{description}
				</Text>
				{buttonLabel && onButtonPress && (
					<Button
						size="sm"
						variant="secondary"
						className="mt-4 rounded-xl bg-surface-tertiary border-0 px-4"
						onPress={onButtonPress}
					>
						<Button.Label className={`${buttonColor} text-xs font-bold`}>
							{buttonLabel}
						</Button.Label>
					</Button>
				)}
			</View>
		);
	}

	return (
		<View className="items-center justify-center mt-12 px-6 opacity-70">
			<View className="bg-surface-secondary p-4 rounded-full mb-3.5">
				<StyledIcon name={icon} size={44} className="text-muted" />
			</View>
			<Text className="text-muted text-center text-lg font-bold">{title}</Text>
			<Text className="text-muted text-center text-sm mt-1 px-8 leading-5">
				{description}
			</Text>
		</View>
	);
}
