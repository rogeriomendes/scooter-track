import DateTimePicker, {
	type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export interface FormDateTimeFieldProps {
	label?: string;
	value: Date | string;
	mode?: "date" | "time";
	icon?: React.ComponentProps<typeof StyledIcon>["name"];
	onPress?: () => void;
	onChange?: (date: Date) => void;
	disabled?: boolean;
	className?: string;
	renderTrigger?: (props: {
		onPress: () => void;
		displayValue: string;
	}) => React.ReactNode;
}

export function FormDateTimeField({
	label,
	value,
	mode = "date",
	icon,
	onPress,
	onChange,
	disabled = false,
	className = "flex-1",
	renderTrigger,
}: FormDateTimeFieldProps) {
	const [showPicker, setShowPicker] = useState(false);
	const resolvedIcon = icon ?? (mode === "time" ? "clock" : "calendar");
	const displayValue =
		value instanceof Date
			? format(value, mode === "time" ? "HH:mm" : "dd/MM/yyyy", {
					locale: ptBR,
				})
			: value;

	const handlePress = () => {
		if (disabled) return;
		if (onPress) {
			onPress();
		} else if (onChange) {
			setShowPicker(true);
		}
	};

	const handlePickerChange = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
		setShowPicker(Platform.OS === "ios");
		if (selectedDate && onChange) {
			onChange(selectedDate);
		}
	};

	return (
		<>
			{renderTrigger ? (
				renderTrigger({ onPress: handlePress, displayValue })
			) : (
				<TextField className={className}>
					{label && <Label>{label}</Label>}
					<Pressable
						onPress={handlePress}
						className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-3 active:opacity-80"
					>
						<Text className="text-foreground text-sm">{displayValue}</Text>
						<StyledIcon name={resolvedIcon} size={16} className="text-muted" />
					</Pressable>
				</TextField>
			)}

			{showPicker && value instanceof Date && (
				<DateTimePicker
					value={value}
					mode={mode}
					is24Hour={true}
					onValueChange={handlePickerChange}
					onDismiss={() => setShowPicker(false)}
				/>
			)}
		</>
	);
}
