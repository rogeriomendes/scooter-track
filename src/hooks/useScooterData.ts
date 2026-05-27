import { db } from "@/db/client";
import { logs, maintenance, scooters } from "@/db/schema";
import { calculateScooterStats } from "@/utils/stats";
import { desc, eq } from "drizzle-orm";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useScooterData(activeScooterId: number | null) {
	const [scooter, setScooter] = useState<typeof scooters.$inferSelect | null>(
		null,
	);
	const [allLogs, setAllLogs] = useState<(typeof logs.$inferSelect)[]>([]);
	const [maintenanceList, setMaintenanceList] = useState<
		(typeof maintenance.$inferSelect)[]
	>([]);
	const [stats, setStats] = useState<ReturnType<
		typeof calculateScooterStats
	> | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [totalScooters, setTotalScooters] = useState(0);

	const loadData = useCallback(async () => {
		if (!activeScooterId) {
			setScooter(null);
			setAllLogs([]);
			setMaintenanceList([]);
			setStats(null);
			setTotalScooters(0);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);

			const allScooters = await db.select().from(scooters);
			setTotalScooters(allScooters.length);

			const s = allScooters
				.filter((sc) => sc.id === activeScooterId)
				.slice(0, 1);
			const currentScooter = s.length > 0 ? s[0] : null;

			if (currentScooter) {
				const l = await db
					.select()
					.from(logs)
					.where(eq(logs.scooterId, activeScooterId))
					.orderBy(desc(logs.date));

				const mList = await db
					.select()
					.from(maintenance)
					.where(eq(maintenance.scooterId, activeScooterId));

				setScooter(currentScooter);
				setAllLogs(l);
				setMaintenanceList(mList);
				setStats(calculateScooterStats(currentScooter, l));
			}
		} catch (error) {
			console.error("Error fetching scooter data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [activeScooterId]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	return {
		scooter,
		allLogs,
		maintenanceList,
		stats,
		totalScooters,
		isLoading,
		refresh: loadData,
	};
}
