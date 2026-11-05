import { desc, eq, sql } from "drizzle-orm";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/db/client";
import { logs, maintenance, scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { calculateScooterStats } from "@/utils/stats";

type ScooterRecord = typeof scooters.$inferSelect;
type LogRecord = typeof logs.$inferSelect;
type MaintenanceRecord = typeof maintenance.$inferSelect;
type StatsResult = ReturnType<typeof calculateScooterStats>;

// Prepared statements para execução ultra-rápida sem overhead de compilação SQL
const getLogsByScooterIdStmt = db
	.select()
	.from(logs)
	.where(eq(logs.scooterId, sql.placeholder("scooterId")))
	.orderBy(desc(logs.date))
	.prepare();

const getMaintenanceByScooterIdStmt = db
	.select()
	.from(maintenance)
	.where(eq(maintenance.scooterId, sql.placeholder("scooterId")))
	.prepare();

interface ScooterCache {
	scooter: ScooterRecord | null;
	allLogs: LogRecord[];
	maintenanceList: MaintenanceRecord[];
	stats: StatsResult | null;
	totalScooters: number;
}

let memoryCache: ScooterCache | null = null;

export function useScooterData(activeScooterId: number | null) {
	const refreshCounter = useAppStore((s) => s.refreshCounter);

	const cached =
		memoryCache !== null &&
		(activeScooterId === null || memoryCache.scooter?.id === activeScooterId)
			? memoryCache
			: null;

	const [scooter, setScooter] = useState<ScooterRecord | null>(
		cached?.scooter ?? null,
	);
	const [allLogs, setAllLogs] = useState<LogRecord[]>(cached?.allLogs ?? []);
	const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>(
		cached?.maintenanceList ?? [],
	);
	const [stats, setStats] = useState<StatsResult | null>(cached?.stats ?? null);
	const [isLoading, setIsLoading] = useState(!cached);
	const [totalScooters, setTotalScooters] = useState(
		cached?.totalScooters ?? 0,
	);

	const hasLoadedRef = useRef(cached !== null);
	const prevScooterIdRef = useRef(activeScooterId);

	if (prevScooterIdRef.current !== activeScooterId) {
		prevScooterIdRef.current = activeScooterId;
		hasLoadedRef.current =
			memoryCache !== null && memoryCache.scooter?.id === activeScooterId;
	}

	const loadData = useCallback(
		async (forceShowSpinner = false) => {
			try {
				if (forceShowSpinner || !hasLoadedRef.current) {
					setIsLoading(true);
				}

				const allScooters = await db.select().from(scooters);
				setTotalScooters(allScooters.length);

				if (allScooters.length === 0) {
					setScooter(null);
					setAllLogs([]);
					setMaintenanceList([]);
					setStats(null);
					memoryCache = {
						scooter: null,
						allLogs: [],
						maintenanceList: [],
						stats: null,
						totalScooters: 0,
					};
					return;
				}

				// Se não houver scooter ativa ou a selecionada não existir mais, seleciona a primeira
				let currentScooter = allScooters.find(
					(sc) => sc.id === activeScooterId,
				);

				if (!currentScooter) {
					currentScooter = allScooters[0];
					useAppStore.getState().setActiveScooterId(currentScooter.id);
				}

				const scooterId = currentScooter.id;

				const [l, mList] = await Promise.all([
					getLogsByScooterIdStmt.execute({ scooterId }),
					getMaintenanceByScooterIdStmt.execute({ scooterId }),
				]);

				const computedStats = calculateScooterStats(currentScooter, l);

				setScooter(currentScooter);
				setAllLogs(l);
				setMaintenanceList(mList);
				setStats(computedStats);

				memoryCache = {
					scooter: currentScooter,
					allLogs: l,
					maintenanceList: mList,
					stats: computedStats,
					totalScooters: allScooters.length,
				};
			} catch (error) {
				console.error("Error fetching scooter data:", error);
			} finally {
				hasLoadedRef.current = true;
				setIsLoading(false);
			}
		},
		[activeScooterId],
	);

	useEffect(() => {
		void refreshCounter;
		loadData();
	}, [loadData, refreshCounter]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	const refresh = useCallback(() => {
		useAppStore.getState().triggerRefresh();
		return loadData(false);
	}, [loadData]);

	return {
		scooter,
		allLogs,
		maintenanceList,
		stats,
		totalScooters,
		isLoading,
		refresh,
	};
}
