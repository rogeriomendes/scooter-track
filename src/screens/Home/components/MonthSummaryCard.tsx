import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "heroui-native/card";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { logs } from "@/db/schema";

type MonthSummaryCardProps = {
	allLogs: (typeof logs.$inferSelect)[];
};

export function MonthSummaryCard({ allLogs }: MonthSummaryCardProps) {
	const now = useMemo(() => new Date(), []);
	const monthName = useMemo(() => {
		const raw = format(now, "MMMM", { locale: ptBR });
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	}, [now]);

	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();
	const currentDayNumber = now.getDate();

	const {
		totalKmMonth,
		monthChargesCount,
		uniqueDaysCount,
		bestDayDistance,
		activeDaysPercent,
	} = useMemo(() => {
		let totalKm = 0;
		let chargesCount = 0;
		const uniqueDays = new Set<string>();
		const dailyKmMap = new Map<string, number>();

		for (const log of allLogs) {
			const d = new Date(log.date);
			if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) {
				continue;
			}

			if (log.type === "charge") {
				chargesCount++;
			} else if (log.type === "trip") {
				totalKm += log.distance;
				const dayKey = format(d, "yyyy-MM-dd");
				uniqueDays.add(dayKey);
				dailyKmMap.set(dayKey, (dailyKmMap.get(dayKey) || 0) + log.distance);
			}
		}

		let maxDaily = 0;
		for (const dist of dailyKmMap.values()) {
			if (dist > maxDaily) maxDaily = dist;
		}

		let activePct = 0;
		if (currentDayNumber > 0) {
			const pct = (uniqueDays.size / currentDayNumber) * 100;
			if (!Number.isNaN(pct) && Number.isFinite(pct)) {
				activePct = Math.min(100, Math.max(0, Math.round(pct)));
			}
		}

		return {
			totalKmMonth: totalKm,
			monthChargesCount: chargesCount,
			uniqueDaysCount: uniqueDays.size,
			bestDayDistance: maxDaily,
			activeDaysPercent: activePct,
		};
	}, [allLogs, currentYear, currentMonth, currentDayNumber]);

	return (
		<View>
			<Card
				variant="default"
				className="mb-4 bg-surface border border-border shadow-sm p-3 rounded-2xl"
			>
				{/* CABEÇALHO COM NOME DO MÊS */}
				<View className="flex-row justify-between items-center mb-3">
					<View className="flex-row items-center gap-2">
						<View className="w-7 h-7 rounded-lg bg-success/15 items-center justify-center">
							<StyledIcon name="calendar" size={15} className="text-success" />
						</View>
						<Text className="text-sm font-black text-foreground">
							Resumo de {monthName}
						</Text>
					</View>
					<View className="bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
						<Text className="text-[10px] font-bold text-success">
							{uniqueDaysCount}{" "}
							{uniqueDaysCount === 1 ? "dia ativo" : "dias ativos"}
						</Text>
					</View>
				</View>

				{/* 3 COLUNAS DE MÉTRICAS */}
				<View className="flex-row gap-2 mb-3">
					{/* DISTÂNCIA NO MÊS */}
					<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl">
						<View className="flex-row items-center gap-1 mb-1">
							<StyledIcon
								name="navigation"
								size={12}
								className="text-success"
							/>
							<Text className="text-[10px] font-bold text-muted uppercase">
								Distância
							</Text>
						</View>
						<Text className="text-base font-black text-foreground">
							{totalKmMonth.toFixed(1)}{" "}
							<Text className="text-[10px] font-bold text-muted">km</Text>
						</Text>
					</View>

					{/* RECARGAS NO MÊS */}
					<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl">
						<View className="flex-row items-center gap-1 mb-1">
							<StyledIcon name="zap" size={12} className="text-info" />
							<Text className="text-[10px] font-bold text-muted uppercase">
								Recargas
							</Text>
						</View>
						<Text className="text-base font-black text-foreground">
							{monthChargesCount}{" "}
							<Text className="text-[10px] font-bold text-muted">
								{monthChargesCount === 1 ? "carga" : "cargas"}
							</Text>
						</Text>
					</View>

					{/* MELHOR DIA */}
					<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl">
						<View className="flex-row items-center gap-1 mb-1">
							<StyledIcon name="award" size={12} className="text-warning" />
							<Text className="text-[10px] font-bold text-muted uppercase">
								Melhor Dia
							</Text>
						</View>
						<Text
							className="text-base font-black text-foreground"
							numberOfLines={1}
						>
							{bestDayDistance > 0 ? bestDayDistance.toFixed(1) : "0.0"}{" "}
							<Text className="text-[10px] font-bold text-muted">km</Text>
						</Text>
					</View>
				</View>

				{/* FREQUÊNCIA DE USO - BARRA DE PROGRESSO */}
				<View className="bg-surface-secondary p-2.5 rounded-xl ">
					<View className="flex-row justify-between items-center mb-1.5">
						<Text className="text-[11px] font-semibold text-muted">
							Frequência de uso no mês
						</Text>
						<Text className="text-[11px] font-bold text-foreground">
							{uniqueDaysCount} de {currentDayNumber} dias ({activeDaysPercent}
							%)
						</Text>
					</View>
					<View className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden flex-row">
						<View
							className="h-full bg-success rounded-full"
							style={{
								width: `${activeDaysPercent}%`,
							}}
						/>
					</View>
				</View>
			</Card>
		</View>
	);
}
