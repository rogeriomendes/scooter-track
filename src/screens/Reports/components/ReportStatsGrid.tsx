import { StatGrid } from "@/components/StatGrid";

export interface PeriodStats {
	totalKm: number;
	totalDays: number;
	activeDays: number;
	avgPerActiveDay: number;
	maxTripKm: number;
	periodLabel: string;
}

interface ReportStatsGridProps {
	stats: PeriodStats;
}

export function ReportStatsGrid({ stats }: ReportStatsGridProps) {
	const activityPct =
		stats.totalDays > 0
			? Math.round((stats.activeDays / stats.totalDays) * 100)
			: 0;

	return (
		<StatGrid
			className="gap-2 mb-3"
			items={[
				{
					icon: "map-pin",
					color: "success",
					label: stats.periodLabel,
					value: stats.totalKm.toFixed(1),
					unit: "km",
					subtitle: "distância percorrida",
				},
				{
					icon: "calendar",
					color: "info",
					label: "Dias Ativos",
					value: `${stats.activeDays}/${stats.totalDays}`,
					unit: "dias",
					subtitle: `${activityPct}% de frequência`,
				},
				{
					icon: "bar-chart-2",
					color: "accent",
					label: "Média / Dia Ativo",
					value: stats.avgPerActiveDay.toFixed(1),
					unit: "km",
					subtitle: "nos dias que rodou",
				},
				{
					icon: "award",
					color: "warning",
					label: "Maior Viagem",
					value: stats.maxTripKm.toFixed(1),
					unit: "km",
					subtitle: "recorde no período",
				},
			]}
		/>
	);
}
