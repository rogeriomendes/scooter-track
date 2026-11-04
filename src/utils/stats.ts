import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateBatteryPercentage } from "../constants/batteryCharts";
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

function toTime(d: Date | string | number): number {
	return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

export function sortLogsAscending(logsList: Log[]): Log[] {
	return [...logsList].sort((a, b) => toTime(a.date) - toTime(b.date));
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
	const sortedLogs = sortLogsAscending(allLogs);

	let totalKm = scooter.initialKm;
	const cycles: Cycle[] = [];

	let cycleStartDate =
		sortedLogs.length > 0
			? sortedLogs[0].date instanceof Date
				? sortedLogs[0].date
				: new Date(sortedLogs[0].date)
			: new Date();
	let cycleDistance = 0;

	let chargesCount = 0;
	let tripsCount = 0;
	let lastChargeDate: Date | null = null;

	for (const log of sortedLogs) {
		const logDate = log.date instanceof Date ? log.date : new Date(log.date);
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
	const currentCycleKm = cycleDistance;
	const completedCycles = cycles.filter((c) => c.distance > 0);

	let bestCycleKm = 0;
	let worstCycleKm = 0;
	let averageCycleKm = 0;

	if (completedCycles.length > 0) {
		let totalCycleDistances = 0;
		bestCycleKm = completedCycles[0].distance;
		worstCycleKm = completedCycles[0].distance;

		for (const c of completedCycles) {
			totalCycleDistances += c.distance;
			if (c.distance > bestCycleKm) bestCycleKm = c.distance;
			if (c.distance < worstCycleKm) worstCycleKm = c.distance;
		}
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

export interface TripConsumption {
	consumedPct: number;
	consumedValue: number;
}

export function calculateTripConsumptionMap(
	scooter: Scooter | null,
	allLogs: Log[],
): Map<number, TripConsumption> {
	const map = new Map<number, TripConsumption>();
	if (!scooter) return map;
	const ascLogs = sortLogsAscending(allLogs);

	let prevBatteryLevel: number | null = null;

	for (const log of ascLogs) {
		if (log.type === "trip") {
			if (prevBatteryLevel !== null && prevBatteryLevel > log.batteryLevel) {
				const diff = prevBatteryLevel - log.batteryLevel;
				let consumedPct = diff;
				if (scooter.trackingMode === "voltage") {
					const prevPct = calculateBatteryPercentage(
						prevBatteryLevel,
						scooter.batteryType,
					);
					const currPct = calculateBatteryPercentage(
						log.batteryLevel,
						scooter.batteryType,
					);
					consumedPct = Math.max(0, prevPct - currPct);
				}
				map.set(log.id, {
					consumedPct: Math.round(consumedPct),
					consumedValue: diff,
				});
			}
			prevBatteryLevel = log.batteryLevel;
		} else if (log.type === "charge") {
			prevBatteryLevel = log.batteryLevel;
		}
	}
	return map;
}

export interface ChargeGain {
	initialPct: number;
	gainedPct: number;
}

export function calculateChargeGainMap(
	scooter: Scooter | null,
	allLogs: Log[],
): Map<number, ChargeGain> {
	const map = new Map<number, ChargeGain>();
	if (!scooter) return map;
	const ascLogs = sortLogsAscending(allLogs);

	let prevBatteryLevel: number | null = null;

	for (const log of ascLogs) {
		if (log.type === "charge") {
			if (prevBatteryLevel !== null && log.batteryLevel > prevBatteryLevel) {
				let prevPct = prevBatteryLevel;
				let currPct = log.batteryLevel;
				if (scooter.trackingMode === "voltage") {
					prevPct = calculateBatteryPercentage(
						prevBatteryLevel,
						scooter.batteryType,
					);
					currPct = calculateBatteryPercentage(
						log.batteryLevel,
						scooter.batteryType,
					);
				}
				const gainedPct = Math.max(0, Math.round(currPct - prevPct));
				map.set(log.id, {
					initialPct: Math.round(prevPct),
					gainedPct,
				});
			}
			prevBatteryLevel = log.batteryLevel;
		} else if (log.type === "trip") {
			prevBatteryLevel = log.batteryLevel;
		}
	}
	return map;
}

export function getOldestLogDate(
	scooter: Scooter | null,
	allLogs: Log[],
): Date {
	let oldest = scooter?.createdAt ? new Date(scooter.createdAt) : new Date();
	for (const log of allLogs) {
		const d = log.date instanceof Date ? log.date : new Date(log.date);
		if (d < oldest) oldest = d;
	}
	return oldest;
}

export interface LogSectionGroup {
	title: string;
	data: Log[];
}

export function filterLogsByMonth(
	allLogs: Log[],
	type: "trip" | "charge",
	selectedMonth: Date | null,
): Log[] {
	return allLogs.filter((l) => {
		if (l.type !== type) return false;
		if (!selectedMonth) return true;
		const logDate = l.date instanceof Date ? l.date : new Date(l.date);
		return (
			logDate.getMonth() === selectedMonth.getMonth() &&
			logDate.getFullYear() === selectedMonth.getFullYear()
		);
	});
}

export function groupLogsByMonth(logsList: Log[]): LogSectionGroup[] {
	const map = new Map<string, LogSectionGroup>();
	const currentYear = new Date().getFullYear();

	for (const item of logsList) {
		const itemDate =
			item.date instanceof Date ? item.date : new Date(item.date);
		const groupTitle =
			itemDate.getFullYear() === currentYear
				? format(itemDate, "MMMM", { locale: ptBR })
				: format(itemDate, "MMMM 'de' yyyy", { locale: ptBR });

		let group = map.get(groupTitle);
		if (!group) {
			group = { title: groupTitle, data: [] };
			map.set(groupTitle, group);
		}
		group.data.push(item);
	}
	return Array.from(map.values());
}

export interface TripPeriodStats {
	totalKm: number;
	avgKm: number;
	maxKm: number;
	activeDays: number;
	tripCount: number;
}

export function calculateTripPeriodStats(tripsList: Log[]): TripPeriodStats {
	if (tripsList.length === 0) {
		return { totalKm: 0, avgKm: 0, maxKm: 0, activeDays: 0, tripCount: 0 };
	}

	let totalKm = 0;
	let maxKm = 0;
	const uniqueDays = new Set<string>();

	for (const trip of tripsList) {
		totalKm += trip.distance;
		if (trip.distance > maxKm) maxKm = trip.distance;
		const tripDate =
			trip.date instanceof Date ? trip.date : new Date(trip.date);
		uniqueDays.add(format(tripDate, "yyyy-MM-dd"));
	}

	const activeDays = uniqueDays.size;
	const avgKm = activeDays > 0 ? totalKm / activeDays : 0;

	return { totalKm, avgKm, maxKm, activeDays, tripCount: tripsList.length };
}
