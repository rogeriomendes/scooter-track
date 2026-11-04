import { useMemo } from "react";
import type { maintenance } from "@/db/schema";
import { calculateMaintenanceWear } from "@/utils/maintenance";
import type { calculateScooterStats } from "@/utils/stats";

export function useMaintenanceHealth(
	maintenanceList: (typeof maintenance.$inferSelect)[],
	stats: ReturnType<typeof calculateScooterStats> | null,
) {
	return useMemo(() => {
		let itemsInRisk = 0;
		const riskItemIds = new Set<number>();
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

			const wear = calculateMaintenanceWear(item, currentTotalKm);

			const itemHasWear = item.hasWear ?? true;
			if (itemHasWear && wear.wearPercentage >= 70) {
				itemsInRisk++;
				riskItemIds.add(item.id);
			}

			if (wear.isPriority) {
				isPriorityActive = true;
				const daysLeft =
					item.type === "date"
						? wear.remainingDaysFixedDate
						: item.type === "months" || item.type === "mixed"
							? wear.remainingDaysMonths
							: 999;

				const priorityScore =
					daysLeft <= 3
						? 10000 + wear.wearPercentage
						: 1000 + wear.wearPercentage;

				if (priorityScore > highestPriorityScore) {
					highestPriorityScore = priorityScore;
					bestPriorityItem = item;
					bestPriorityItemInfo = { primary: wear.pInfo, secondary: wear.sInfo };
				}
			} else {
				if (wear.wearPercentage > highestNormalWear) {
					highestNormalWear = wear.wearPercentage;
					bestNormalItem = item;
					bestNormalItemInfo = { primary: wear.pInfo, secondary: wear.sInfo };
				}
			}
		}

		nextItem = bestPriorityItem || bestNormalItem;
		const nextItemInfo = bestPriorityItem
			? bestPriorityItemInfo
			: bestNormalItemInfo;

		return {
			itemsInRisk,
			riskItemIds,
			nextItem,
			nextItemInfo,
			isPriorityActive,
		};
	}, [maintenanceList, stats?.totalKm]);
}
