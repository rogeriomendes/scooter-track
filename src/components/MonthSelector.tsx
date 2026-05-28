import { eachMonthOfInterval, format, isAfter, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
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
	const start = minDate ? startOfMonth(minDate) : subMonths(startOfMonth(new Date()), 6);
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
					const isSelected = month.getTime() === startOfMonth(currentDate).getTime();
					return (
						<Pressable
							key={month.getTime()}
							onPress={() => onChange(month)}
							className={`px-4 py-2 rounded-full border shadow-sm ${
								isSelected
									? "bg-success border-success shadow-success/20"
									: "bg-surface border-surface-secondary"
							}`}
						>
							<Text
								className={`text-xs font-bold capitalize tracking-wider ${
									isSelected ? "text-white" : "text-muted"
								}`}
							>
								{format(month, "MMM yy", { locale: ptBR })}
							</Text>
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}
