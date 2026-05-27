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
			averageCycleKm: 0,
			cycles: [],
			estimatedAutonomy: 0,
			totalKm: scooter?.initialKm || 0,
			chargesCount: 0,
			tripsCount: 0,
			lastChargeDate: null as Date | null,
		};
	}

	// Logs are assumed to be sorted by descending date (newest first).
	// Let's sort them ascending (oldest first) to build cycles chronologically.
	const sortedLogs = [...allLogs].sort(
		(a, b) => a.date.getTime() - b.date.getTime(),
	);

	let totalKm = scooter.initialKm;
	let currentCycleKm = 0;
	const cycles: Cycle[] = [];

	let cycleStartDate = sortedLogs.length > 0 ? sortedLogs[0].date : new Date();
	let cycleDistance = 0;

	let chargesCount = 0;
	let tripsCount = 0;
	let lastChargeDate: Date | null = null;

	for (const log of sortedLogs) {
		if (log.type === "trip") {
			cycleDistance += log.distance;
			totalKm += log.distance;
			tripsCount++;
		} else if (log.type === "charge") {
			chargesCount++;
			lastChargeDate = log.date;

			// Complete the cycle
			cycles.push({
				id: `cycle-${log.id}`,
				startDate: cycleStartDate,
				endDate: log.date,
				distance: cycleDistance,
				chargeLog: log,
			});

			// Reset for next cycle
			cycleStartDate = log.date;
			cycleDistance = 0;
		}
	}

	// The remaining cycleDistance is the current cycle (since last charge)
	currentCycleKm = cycleDistance;

	const completedCycles = cycles.filter((c) => c.distance > 0);

	let bestCycleKm = 0;
	let averageCycleKm = 0;

	if (completedCycles.length > 0) {
		bestCycleKm = Math.max(...completedCycles.map((c) => c.distance));
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
		averageCycleKm,
		cycles,
		estimatedAutonomy,
		totalKm,
		chargesCount,
		tripsCount,
		lastChargeDate,
	};
}
