import { desc, eq } from "drizzle-orm";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/db/client";
import { logs, maintenance, scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { calculateScooterStats } from "@/utils/stats";

export function useScooterData(activeScooterId: number | null) {
	const refreshCounter = useAppStore((s) => s.refreshCounter);
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
		try {
			setIsLoading(true);

			const allScooters = await db.select().from(scooters);
			setTotalScooters(allScooters.length);

			if (allScooters.length === 0) {
				setScooter(null);
				setAllLogs([]);
				setMaintenanceList([]);
				setStats(null);
				return;
			}

			// Se não houver scooter ativa ou a selecionada não existir mais, seleciona a primeira
			let currentScooter = allScooters.find((sc) => sc.id === activeScooterId);

			if (!currentScooter) {
				currentScooter = allScooters[0];
				useAppStore.getState().setActiveScooterId(currentScooter.id);
			}

			const scooterId = currentScooter.id;

			const l = await db
				.select()
				.from(logs)
				.where(eq(logs.scooterId, scooterId))
				.orderBy(desc(logs.date));

			const mList = await db
				.select()
				.from(maintenance)
				.where(eq(maintenance.scooterId, scooterId));

			setScooter(currentScooter);
			setAllLogs(l);
			setMaintenanceList(mList);
			setStats(calculateScooterStats(currentScooter, l));
		} catch (error) {
			console.error("Error fetching scooter data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [activeScooterId]);

	useEffect(() => {
		void refreshCounter;
		loadData();
	}, [loadData, refreshCounter]);

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
