import type React from "react";
import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenWrapperProps = {
	children: React.ReactNode;
	className?: string;
	contentContainerClassName?: string;
	scrollable?: boolean;
	style?: ViewProps["style"] | ScrollViewProps["style"];
} & ViewProps &
	ScrollViewProps;

export function ScreenWrapper({
	children,
	style,
	className = "",
	contentContainerClassName = "",
	scrollable = false,
	...props
}: ScreenWrapperProps) {
	const insets = useSafeAreaInsets();

	const defaultStyle = { paddingTop: Math.max(insets.top, 16) };

	if (scrollable) {
		return (
			<ScrollView
				className={`flex-1 bg-background ${className}`}
				style={[defaultStyle, style]}
				contentContainerClassName={contentContainerClassName}
				{...(props as ScrollViewProps)}
			>
				{children}
			</ScrollView>
		);
	}

	return (
		<View
			className={`flex-1 bg-background ${className}`}
			style={[defaultStyle, style]}
			{...(props as ViewProps)}
		>
			{children}
		</View>
	);
}
