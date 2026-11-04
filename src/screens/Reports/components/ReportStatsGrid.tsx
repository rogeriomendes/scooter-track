import { StatGrid } from "@/components/StatGrid";

interface ReportStatsGridProps {
	chartStats: {
		mainLabel: string;
		mainValue: number;
		avgLabel: string;
		avgValue: number;
		maxLabel: string;
		maxValue: number;
		countLabel: string;
		countValue: string;
	};
}

export function ReportStatsGrid({ chartStats }: ReportStatsGridProps) {
	return (
		<StatGrid
			className="gap-2 mb-3"
			items={[
				{
					icon: "map-pin",
					color: "success",
					label: chartStats.mainLabel,
					value: chartStats.mainValue.toFixed(1),
					unit: "km",
				},
				{
					icon: "bar-chart-2",
					color: "accent",
					label: chartStats.avgLabel,
					value: chartStats.avgValue.toFixed(1),
					unit: "km",
				},
				{
					icon: "award",
					color: "warning",
					label: chartStats.maxLabel,
					value: chartStats.maxValue.toFixed(1),
					unit: "km",
				},
				{
					icon: "hash",
					color: "info",
					label: chartStats.countLabel,
					value: chartStats.countValue,
				},
			]}
		/>
	);
}
