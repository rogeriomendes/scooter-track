import { useBottomSheetAwareHandlers } from "heroui-native";
import { Input } from "heroui-native/input";
import type React from "react";

export const BottomSheetInput = (props: React.ComponentProps<typeof Input>) => {
	const { onFocus, onBlur } = useBottomSheetAwareHandlers();
	return (
		<Input
			autoCapitalize="none"
			autoCorrect={false}
			onFocus={onFocus}
			onBlur={onBlur}
			{...props}
		/>
	);
};
