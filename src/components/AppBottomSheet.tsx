import BottomSheet, { BottomSheetView } from "@expo/ui/community/bottom-sheet";
import type React from "react";
import { useEffect, useRef } from "react";
import { Keyboard, ScrollView, Text, useColorScheme } from "react-native";
import { useAppStore } from "@/store/useAppStore";

interface AppBottomSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	snapPoints?: (string | number)[];
	enableDynamicSizing?: boolean;
	children: React.ReactNode;
}

export function AppBottomSheet({
	isOpen,
	onOpenChange,
	title,
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
					{title && (
						<Text className="text-xl font-bold text-foreground mb-4">
							{title}
						</Text>
					)}
					{children}
				</ScrollView>
			</BottomSheetView>
		</BottomSheet>
	);
}
