import { addMonths, differenceInDays } from "date-fns";
import { useMemo } from "react";
import type { maintenance } from "@/db/schema";
import type { calculateScooterStats } from "@/utils/stats";

export function useMaintenanceHealth(
	maintenanceList: (typeof maintenance.$inferSelect)[],
	stats: ReturnType<typeof calculateScooterStats> | null,
) {
	return useMemo(() => {
		let itemsInRisk = 0;
		let nextItem: typeof maintenance.$inferSelect | null = null;

		let highestPriorityScore = -1;
		let highestNormalWear = -1;
		let bestPriorityItemInfo = { primary: "", secondary: "" };
		let bestNormalItemInfo = { primary: "", secondary: "" };
		let bestPriorityItem: typeof maintenance.$inferSelect | null = null;
		let bestNormalItem: typeof maintenance.$inferSelect | null = null;
		let isPriorityActive = false;

		const currentTotalKm = stats?.totalKm || 0;

		for (const item of maintenanceList) {
			if (item.isCompleted) continue;

			const itemType = item.type || "km";

			const wornKm = currentTotalKm - item.lastMaintenanceKm;
			const remainingKm = Math.max(0, item.intervalKm - wornKm);
			const wearPercentageKm =
				item.intervalKm > 0 ? (wornKm / item.intervalKm) * 100 : 0;

			let wearPercentageMonths = 0;
			let remainingDaysMonths = 0;
			if (item.lastMaintenanceDate && item.intervalMonths) {
				const nextDate = addMonths(
					item.lastMaintenanceDate,
					item.intervalMonths,
				);
				const totalDays =
					differenceInDays(nextDate, item.lastMaintenanceDate) || 1;
				const daysPassed = differenceInDays(
					new Date(),
					item.lastMaintenanceDate,
				);
				remainingDaysMonths = Math.max(0, totalDays - daysPassed);
				wearPercentageMonths = (daysPassed / totalDays) * 100;
			}

			let wearPercentageFixedDate = 0;
			let remainingDaysFixedDate = 0;
			if (item.targetDate && item.lastMaintenanceDate) {
				const totalDays =
					differenceInDays(item.targetDate, item.lastMaintenanceDate) || 1;
				const daysPassed = differenceInDays(
					new Date(),
					item.lastMaintenanceDate,
				);
				remainingDaysFixedDate = Math.max(0, totalDays - daysPassed);
				wearPercentageFixedDate = (daysPassed / totalDays) * 100;
			}

			let wearPercentage = 0;
			let pInfo = "";
			let sInfo = "";
			let isPriority = false;
			let priorityScore = 0;

			if (itemType === "km") {
				wearPercentage = wearPercentageKm;
				pInfo = `${remainingKm.toFixed(0)}`;
				sInfo = "km restantes";
				if (remainingKm <= 50) isPriority = true;
			} else if (itemType === "months") {
				wearPercentage = wearPercentageMonths;
				pInfo = `${remainingDaysMonths}`;
				sInfo = "dias restantes";
				if (remainingDaysMonths <= 15) isPriority = true;
			} else if (itemType === "date") {
				wearPercentage = wearPercentageFixedDate;
				pInfo = `${remainingDaysFixedDate}`;
				sInfo = "dias restantes";
				if (remainingDaysFixedDate <= 15) isPriority = true;
			} else if (itemType === "mixed") {
				wearPercentage = Math.max(wearPercentageKm, wearPercentageMonths);
				if (wearPercentageKm > wearPercentageMonths) {
					pInfo = `${remainingKm.toFixed(0)}`;
					sInfo = "km restantes";
				} else {
					pInfo = `${remainingDaysMonths}`;
					sInfo = "dias restantes";
				}
				if (remainingKm <= 50 || remainingDaysMonths <= 15) isPriority = true;
			}

			const itemHasWear = item.hasWear ?? true;
			if (itemHasWear && wearPercentage >= 70) itemsInRisk++;

			if (isPriority) {
				isPriorityActive = true;
				// If priority, the one with lowest absolute remaining (days or km) gets a high score.
				// Since we can't easily compare 10 days to 10 km, we use the wear percentage as tie-breaker,
				// BUT we prioritize Dates if they are extremely close (<= 3 dias).
				const daysLeft =
					itemType === "date"
						? remainingDaysFixedDate
						: itemType === "months" || itemType === "mixed"
							? remainingDaysMonths
							: 999;

				if (daysLeft <= 3) {
					priorityScore = 10000 + wearPercentage; // Critical date
				} else {
					priorityScore = 1000 + wearPercentage;
				}

				if (priorityScore > highestPriorityScore) {
					highestPriorityScore = priorityScore;
					bestPriorityItem = item;
					bestPriorityItemInfo = { primary: pInfo, secondary: sInfo };
				}
			} else {
				if (wearPercentage > highestNormalWear) {
					highestNormalWear = wearPercentage;
					bestNormalItem = item;
					bestNormalItemInfo = { primary: pInfo, secondary: sInfo };
				}
			}
		}

		nextItem = bestPriorityItem || bestNormalItem;
		const nextItemInfo = bestPriorityItem
			? bestPriorityItemInfo
			: bestNormalItemInfo;

		return { itemsInRisk, nextItem, nextItemInfo, isPriorityActive };
	}, [maintenanceList, stats]);
}
