import BottomSheet, { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import type React from "react";
import { useEffect, useRef } from "react";
import { Keyboard, ScrollView, Text, useColorScheme, View } from "react-native";
import { useAppStore } from "@/store/useAppStore";

interface AppBottomSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	headerRight?: React.ReactNode;
	snapPoints?: (string | number)[];
	enableDynamicSizing?: boolean;
	children: React.ReactNode;
}

export function AppBottomSheet({
	isOpen,
	onOpenChange,
	title,
	headerRight,
	snapPoints,
	enableDynamicSizing = true,
	children,
}: AppBottomSheetProps) {
	const sheetRef = useRef<BottomSheet>(null);
	const theme = useAppStore((state) => state.theme);
	const systemColorScheme = useColorScheme();

	const isDark =
		theme === "dark" || (theme === "system" && systemColorScheme === "dark");

	useEffect(() => {
		if (isOpen) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<BottomSheet
			ref={sheetRef}
			index={0}
			snapPoints={snapPoints}
			enableDynamicSizing={enableDynamicSizing}
			enablePanDownToClose
			backgroundStyle={{
				backgroundColor: isDark ? "#18181b" : "#ffffff",
			}}
			handleIndicatorStyle={{
				backgroundColor: isDark ? "#52525b" : "#d4d4d8",
			}}
			onChange={(index) => {
				if (index === -1) {
					Keyboard.dismiss();
					onOpenChange(false);
				}
			}}
		>
			<BottomSheetView style={{ paddingHorizontal: 16 }}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{ paddingBottom: 16 }}
				>
					{(title || headerRight) && (
						<View className="flex-row items-center justify-between mb-4">
							{title ? (
								<Text className="text-xl font-bold text-foreground flex-1 pr-2">
									{title}
								</Text>
							) : (
								<View className="flex-1" />
							)}
							{headerRight}
						</View>
					)}
					{children}
				</ScrollView>
			</BottomSheetView>
		</BottomSheet>
	);
}
