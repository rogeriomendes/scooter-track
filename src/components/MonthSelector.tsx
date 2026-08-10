import {
	eachMonthOfInterval,
	format,
	isAfter,
	startOfMonth,
	subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text, View } from "react-native";

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
	const start = minDate
		? startOfMonth(minDate)
		: subMonths(startOfMonth(new Date()), 6);
	const end = maxDate ? startOfMonth(maxDate) : startOfMonth(new Date());

	// Fallback de segurança caso minDate > maxDate
	const safeStart = isAfter(start, end) ? end : start;

	const months = eachMonthOfInterval({ start: safeStart, end });

	// Mostrar meses mais recentes primeiro
	const reversedMonths = [...months].reverse();

	return (
		<View className="mb-4">
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-2"
			>
				{reversedMonths.map((month) => {
					const isSelected =
						month.getTime() === startOfMonth(currentDate).getTime();
					return (
						<Pressable
							key={month.getTime()}
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								onChange(month);
							}}
							className={`px-4 py-2 rounded-xl flex-row items-center gap-1.5 transition-all ${
								isSelected
									? "bg-success/15 border border-success/30 shadow-sm"
									: "bg-surface-tertiary border border-transparent active:opacity-70"
							}`}
						>
							{isSelected && (
								<View className="w-1.5 h-1.5 rounded-full bg-success" />
							)}
							<Text
								className={`text-xs font-bold capitalize ${
									isSelected ? "text-success" : "text-muted"
								}`}
							>
								{format(month, "MMMM yyyy", { locale: ptBR })}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}
