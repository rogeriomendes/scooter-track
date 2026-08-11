import type { logs, scooters } from "../db/schema";

export type Log = typeof logs.$inferSelect;
export type Scooter = typeof scooters.$inferSelect;

export interface Cycle {
	id: string;
	startDate: Date;
	endDate: Date;
	distance: number;
	chargeLog: Log;
}

export function calculateScooterStats(scooter: Scooter | null, allLogs: Log[]) {
	if (!scooter || allLogs.length === 0) {
		return {
			currentCycleKm: 0,
			bestCycleKm: 0,
			worstCycleKm: 0,
			averageCycleKm: 0,
			cycles: [],
			estimatedAutonomy: 0,
			totalKm: scooter?.initialKm || 0,
			chargesCount: 0,
			tripsCount: 0,
			lastChargeDate: null as Date | null,
		};
	}

	// Logs are sorted ascending (oldest first) to build cycles chronologically.
	const sortedLogs = [...allLogs].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);

	let totalKm = scooter.initialKm;
	let currentCycleKm = 0;
	const cycles: Cycle[] = [];

	let cycleStartDate =
		sortedLogs.length > 0 ? new Date(sortedLogs[0].date) : new Date();
	let cycleDistance = 0;

	let chargesCount = 0;
	let tripsCount = 0;
	let lastChargeDate: Date | null = null;

	for (const log of sortedLogs) {
		const logDate = new Date(log.date);
		if (log.type === "trip") {
			cycleDistance += log.distance;
			totalKm += log.distance;
			tripsCount++;
		} else if (log.type === "charge") {
			chargesCount++;
			lastChargeDate = logDate;

			// Complete the cycle ONLY if distance was accumulated (trips ridden before this charge)
			if (cycleDistance > 0) {
				cycles.push({
					id: `cycle-${log.id}`,
					startDate: cycleStartDate,
					endDate: logDate,
					distance: cycleDistance,
					chargeLog: log,
				});
			}

			// Reset for next cycle
			cycleStartDate = logDate;
			cycleDistance = 0;
		} else if (log.type === "initial") {
			cycleStartDate = logDate;
		}
	}

	// The remaining cycleDistance is the current cycle (since last charge)
	currentCycleKm = cycleDistance;

	const completedCycles = cycles.filter((c) => c.distance > 0);

	let bestCycleKm = 0;
	let worstCycleKm = 0;
	let averageCycleKm = 0;

	if (completedCycles.length > 0) {
		bestCycleKm = Math.max(...completedCycles.map((c) => c.distance));
		worstCycleKm = Math.min(...completedCycles.map((c) => c.distance));
		const totalCycleDistances = completedCycles.reduce(
			(sum, c) => sum + c.distance,
			0,
		);
		averageCycleKm = totalCycleDistances / completedCycles.length;
	}

	// Estimated autonomy:
	// Simple approach: average of completed cycles. If no completed cycles, use autonomyGoal if > 0.
	const estimatedAutonomy =
		averageCycleKm > 0 ? averageCycleKm : scooter.autonomyGoal || 0;

	return {
		currentCycleKm,
		bestCycleKm,
		worstCycleKm,
		averageCycleKm,
		cycles: completedCycles,
		estimatedAutonomy,
		totalKm,
		chargesCount,
		tripsCount,
		lastChargeDate,
	};
}
