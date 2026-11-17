import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "heroui-native/card";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { calculateScooterStats, Scooter } from "@/utils/stats";

type ScooterStats = ReturnType<typeof calculateScooterStats>;

interface BatteryCyclesCardProps {
	scooter: Scooter;
	stats: ScooterStats | null;
}

export function BatteryCyclesCard({ scooter, stats }: BatteryCyclesCardProps) {
	const cycles = stats?.cycles || [];
	const completedCount = cycles.length;
	const avgCycle = stats?.averageCycleKm || 0;
	const bestCycle = stats?.bestCycleKm || 0;
	const currentCycleKm = stats?.currentCycleKm || 0;
	const autonomyGoal = scooter.autonomyGoal || 0;

	// Target reference for comparison: real avg if exists, otherwise scooter goal
	const targetKm =
		avgCycle > 0 ? avgCycle : autonomyGoal > 0 ? autonomyGoal : 30;

	// Recent cycles to show (up to 3)
	const recentCycles = [...cycles].reverse().slice(0, 3);

	return (
		<Card
			variant="default"
			className="mb-3 bg-surface border border-border shadow-sm rounded-2xl p-4"
		>
			{/* HEADER */}
			<View className="flex-row items-center justify-between mb-3.5">
				<View className="flex-row items-center gap-2.5 flex-1">
					<View className="w-8 h-8 rounded-xl bg-success/15 items-center justify-center">
						<StyledIcon
							name="battery-charging"
							size={16}
							className="text-success"
							style={{ transform: [{ translateX: 1.5 }] }}
						/>
					</View>
					<View className="flex-1">
						<Text className="text-sm font-bold text-foreground">
							Eficiência & Ciclos de Carga
						</Text>
						<Text className="text-xs text-muted">
							Autonomia real calculada entre recargas
						</Text>
					</View>
				</View>

				<View className="bg-surface-secondary px-2.5 py-1 rounded-full border border-border">
					<Text className="text-[10px] font-bold text-foreground">
						{scooter.batteryType}
					</Text>
				</View>
			</View>

			{/* 3 METRIC PILLARS */}
			<View className="flex-row gap-2 mb-3.5">
				{/* Autonomia Média */}
				<View className="flex-1 bg-surface-secondary/70 p-2.5 rounded-xl border border-border/40">
					<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
						Autonomia Média
					</Text>
					<Text className="text-base font-black text-foreground">
						{avgCycle > 0
							? `${avgCycle.toFixed(1)} km`
							: autonomyGoal > 0
								? `${autonomyGoal.toFixed(0)} km*`
								: "--"}
					</Text>
					<Text className="text-[10px] text-muted">
						{avgCycle > 0 ? "calculada real" : "*meta informada"}
					</Text>
				</View>

				{/* Melhor Ciclo */}
				<View className="flex-1 bg-surface-secondary/70 p-2.5 rounded-xl border border-border/40">
					<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
						Melhor Ciclo
					</Text>
					<Text className="text-base font-black text-success">
						{bestCycle > 0 ? `${bestCycle.toFixed(1)} km` : "--"}
					</Text>
					<Text className="text-[10px] text-muted">recorde de carga</Text>
				</View>

				{/* Total de Ciclos */}
				<View className="flex-1 bg-surface-secondary/70 p-2.5 rounded-xl border border-border/40">
					<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
						Ciclos Concluídos
					</Text>
					<Text className="text-base font-black text-foreground">
						{completedCount}
					</Text>
					<Text className="text-[10px] text-muted">
						{stats?.chargesCount || 0} recargas
					</Text>
				</View>
			</View>

			{/* CICLO ATUAL EM ANDAMENTO */}
			<View className="bg-surface-secondary/50 rounded-xl p-3 border border-border/60 mb-3">
				<View className="flex-row items-center justify-between mb-1.5">
					<View className="flex-row items-center gap-1.5">
						<View className="w-2 h-2 rounded-full bg-success animate-pulse" />
						<Text className="text-xs font-bold text-foreground">
							Carga Atual
						</Text>
					</View>
					<Text className="text-xs font-bold text-foreground">
						{currentCycleKm.toFixed(1)} km
						{targetKm > 0 && (
							<Text className="text-muted font-normal">
								{" "}
								/ ~{targetKm.toFixed(0)} km
							</Text>
						)}
					</Text>
				</View>

				{/* Barra de Progresso do Ciclo Atual */}
				<View className="h-2 w-full bg-surface-tertiary rounded-full overflow-hidden">
					<View
						className="h-full bg-success rounded-full"
						style={{
							width: `${Math.min(100, targetKm > 0 ? (currentCycleKm / targetKm) * 100 : 0)}%`,
						}}
					/>
				</View>
				<Text className="text-[10px] text-muted mt-1.5">
					Quilômetros rodados desde a última recarga registrada.
				</Text>
			</View>

			{/* LISTA DOS ÚLTIMOS CICLOS CONCLUÍDOS */}
			{recentCycles.length > 0 ? (
				<View className="gap-2">
					<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
						Histórico de Cargas Anteriores
					</Text>
					{recentCycles.map((cycle, index) => {
						const cycleNum = completedCount - index;
						const progressPct = Math.min(
							100,
							targetKm > 0 ? (cycle.distance / targetKm) * 100 : 0,
						);
						const startStr = format(new Date(cycle.startDate), "dd/MM", {
							locale: ptBR,
						});
						const endStr = format(new Date(cycle.endDate), "dd/MM", {
							locale: ptBR,
						});

						return (
							<View
								key={cycle.id || index}
								className="bg-surface-secondary/40 p-2.5 rounded-xl border border-border/30 flex-row items-center justify-between"
							>
								<View className="flex-1 pr-3">
									<View className="flex-row items-center gap-2 mb-1">
										<Text className="text-xs font-bold text-foreground">
											Ciclo #{cycleNum}
										</Text>
										<Text className="text-[10px] text-muted">
											{startStr} até {endStr}
										</Text>
									</View>
									<View className="h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden">
										<View
											className="h-full bg-success/80 rounded-full"
											style={{ width: `${progressPct}%` }}
										/>
									</View>
								</View>

								<View className="items-end">
									<Text className="text-xs font-black text-foreground">
										{cycle.distance.toFixed(1)} km
									</Text>
									<Text className="text-[10px] text-muted">
										{targetKm > 0
											? `${progressPct.toFixed(0)}% da meta`
											: "concluído"}
									</Text>
								</View>
							</View>
						);
					})}
				</View>
			) : (
				<View className="py-1">
					<Text className="text-[11px] text-muted leading-4">
						Dica: após rodar, registre uma nova recarga na aba Recargas para que
						o app feche o ciclo e calcule a autonomia média real da sua scooter.
					</Text>
				</View>
			)}
		</Card>
	);
}
