import { StyledIcon } from "@/components/StyledIcon";
import {
	addMonths,
	format,
	isAfter,
	isBefore,
	startOfMonth,
	subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

interface MonthSelectorProps {
	currentDate: Date;
	onChange: (newDate: Date) => void;
	minDate?: Date;
	maxDate?: Date;
}

export function MonthSelector({
	currentDate,
	onChange,
	minDate,
	maxDate,
}: MonthSelectorProps) {
	const currentStart = startOfMonth(currentDate);

	const prevMonth = subMonths(currentStart, 1);
	const nextMonth = addMonths(currentStart, 1);

	// Check if prev/next are out of bounds
	const isPrevDisabled = minDate
		? isBefore(prevMonth, startOfMonth(minDate))
		: false;
	const isNextDisabled = maxDate
		? isAfter(nextMonth, startOfMonth(maxDate))
		: false;

	const handlePrevious = () => {
		if (!isPrevDisabled) onChange(prevMonth);
	};

	const handleNext = () => {
		if (!isNextDisabled) onChange(nextMonth);
	};

	return (
		<View className="flex-row items-center justify-between bg-surface p-2 rounded-2xl border border-surface-secondary mb-4">
			<Button
				size="sm"
				isIconOnly
				variant="ghost"
				onPress={handlePrevious}
				className="rounded-full"
				isDisabled={isPrevDisabled}
			>
				<StyledIcon
					name="chevron-left"
					size={20}
					className={
						isPrevDisabled ? "text-muted opacity-50" : "text-foreground"
					}
				/>
			</Button>

			<View className="items-center px-4">
				<Text className="text-sm font-black text-foreground uppercase tracking-widest">
					{format(currentDate, "MMMM", { locale: ptBR })}
				</Text>
				<Text className="text-xs text-muted font-bold">
					{format(currentDate, "yyyy")}
				</Text>
			</View>

			<Button
				size="sm"
				isIconOnly
				variant="ghost"
				onPress={handleNext}
				className="rounded-full"
				isDisabled={isNextDisabled}
			>
				<StyledIcon
					name="chevron-right"
					size={20}
					className={
						isNextDisabled ? "text-muted opacity-50" : "text-foreground"
					}
				/>
			</Button>
		</View>
	);
}
