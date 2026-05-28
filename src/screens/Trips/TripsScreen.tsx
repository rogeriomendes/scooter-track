import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { Button } from "heroui-native";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { TripFormSheet } from "./components/TripFormSheet";

export default function TripsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, isLoading } =
		useScooterData(activeScooterId);

	const [currentMonth, setCurrentMonth] = useState(
		new Date(new Date().getFullYear(), new Date().getMonth(), 1),
	);
	const [page, setPage] = useState(1);
	const itemsPerPage = 30; // Increased since we use section list

	const tripsList = useMemo(() => {
		return allLogs.filter((l) => {
			if (l.type !== "trip") return false;
			const logDate = new Date(l.date);
			return (
				logDate.getMonth() === currentMonth.getMonth() &&
				logDate.getFullYear() === currentMonth.getFullYear()
			);
		});
	}, [allLogs, currentMonth]);

	const dashboardStats = useMemo(() => {
		if (tripsList.length === 0)
			return { totalKm: 0, avgKm: 0, maxKm: 0, activeDays: 0 };

		let totalKm = 0;
		let maxKm = 0;
		const uniqueDays = new Set<string>();

		for (const trip of tripsList) {
			totalKm += trip.distance;
			if (trip.distance > maxKm) maxKm = trip.distance;
			uniqueDays.add(format(new Date(trip.date), "yyyy-MM-dd"));
		}

		const activeDays = uniqueDays.size;
		const avgKm = totalKm / activeDays;

		return { totalKm, avgKm, maxKm, activeDays };
	}, [tripsList]);

	const displayedTrips = useMemo(
		() => tripsList.slice(0, page * itemsPerPage),
		[tripsList, page],
	);

	const groupedTrips = useMemo(() => {
		const groups: { title: string; data: (typeof logs.$inferSelect)[] }[] = [];
		const todayStr = format(new Date(), "yyyy-MM-dd");
		const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

		for (const trip of displayedTrips) {
			const tripDate = new Date(trip.date);
			const dateStr = format(tripDate, "yyyy-MM-dd");

			let groupTitle = format(tripDate, "dd 'de' MMMM", { locale: ptBR });
			if (dateStr === todayStr) groupTitle = "Hoje";
			else if (dateStr === yesterdayStr) groupTitle = "Ontem";

			const existingGroup = groups.find((g) => g.title === groupTitle);
			if (existingGroup) {
				existingGroup.data.push(trip);
			} else {
				groups.push({ title: groupTitle, data: [trip] });
			}
		}
		return groups;
	}, [displayedTrips]);

	const minDate = useMemo(() => {
		let oldest = scooter?.createdAt ? new Date(scooter.createdAt) : new Date();
		for (const log of allLogs) {
			const d = new Date(log.date);
			if (d < oldest) oldest = d;
		}
		return oldest;
	}, [allLogs, scooter]);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<number | null>(null);
	const [logToEdit, setLogToEdit] = useState<typeof logs.$inferSelect | null>(
		null,
	);

	const handleDelete = async (id: number) => {
		await db.delete(logs).where(eq(logs.id, id));
		refresh();
		setLogToDelete(null);
	};

	const handleEdit = (item: typeof logs.$inferSelect) => {
		setLogToEdit(item);
		setIsBottomSheetOpen(true);
	};

	if (isLoading) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#10b981" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return (
			<EmptyScooterState
				title="Usos"
				description="Adicione uma scooter primeiro para registrar viagens."
			/>
		);
	}

	return (
		<ScreenWrapper>
			{/* CABEÇALHO */}
			<View className="px-4 pt-4 pb-2">
				<Animated.Text
					entering={FadeInDown.delay(100).springify()}
					className="text-3xl font-bold text-foreground mb-1"
				>
					Usos
				</Animated.Text>
				<Animated.Text
					entering={FadeInDown.delay(200).springify()}
					className="text-xs font-bold text-muted uppercase tracking-wider"
				>
					{scooter.name}
				</Animated.Text>
			</View>

			{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD) */}
			<Animated.View
				entering={FadeInDown.delay(300).springify()}
				className="flex-col gap-3 px-4 mb-4 mt-2"
			>
				<View className="flex-row gap-3">
					<Card
						variant="secondary"
						className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
					>
						<StyledIcon name="map" size={18} className="mb-2 text-info" />
						<View className="flex-row items-baseline gap-1">
							<Text className="text-xl font-black text-foreground">
								{dashboardStats.totalKm.toFixed(1)}
							</Text>
							<Text className="font-bold text-muted text-[10px]">km</Text>
						</View>
						<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
							Total no Mês
						</Text>
					</Card>
					<Card
						variant="secondary"
						className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
					>
						<StyledIcon
							name="bar-chart-2"
							size={18}
							className="mb-2 text-primary"
						/>
						<View className="flex-row items-baseline gap-1">
							<Text className="text-xl font-black text-foreground">
								{dashboardStats.avgKm.toFixed(1)}
							</Text>
							<Text className="font-bold text-muted text-[10px]">km/dia</Text>
						</View>
						<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
							Média de Uso
						</Text>
					</Card>
				</View>
				<View className="flex-row gap-3">
					<Card
						variant="secondary"
						className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
					>
						<StyledIcon
							name="trending-up"
							size={18}
							className="mb-2 text-warning"
						/>
						<View className="flex-row items-baseline gap-1">
							<Text className="text-xl font-black text-foreground">
								{dashboardStats.maxKm.toFixed(1)}
							</Text>
							<Text className="font-bold text-muted text-[10px]">km</Text>
						</View>
						<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
							Maior Uso
						</Text>
					</Card>
					<Card
						variant="secondary"
						className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
					>
						<StyledIcon
							name="calendar"
							size={18}
							className="mb-2 text-success"
						/>
						<View className="flex-row items-baseline gap-1">
							<Text className="text-xl font-black text-foreground">
								{dashboardStats.activeDays}
							</Text>
							<Text className="font-bold text-muted text-[10px]">dias</Text>
						</View>
						<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
							Dias Ativos
						</Text>
					</Card>
				</View>
			</Animated.View>

			{/* SELETOR DE MÊS */}
			<Animated.View
				entering={FadeInDown.delay(400).springify()}
				className="pl-4 pr-0"
			>
				<MonthSelector
					currentDate={currentMonth}
					minDate={minDate}
					maxDate={new Date()}
					onChange={(newDate) => {
						setCurrentMonth(newDate);
						setPage(1);
					}}
				/>
			</Animated.View>

			{/* LISTA E DASHBOARD AGRUPADO */}
			<SectionList
				sections={groupedTrips}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 gap-3 pt-2"
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (displayedTrips.length < tripsList.length) {
						setPage((p) => p + 1);
					}
				}}
				onEndReachedThreshold={0.5}
				ListHeaderComponent={null}
				ListFooterComponent={
					displayedTrips.length < tripsList.length ? (
						<ActivityIndicator size="small" color="#10b981" className="py-4" />
					) : null
				}
				ListEmptyComponent={
					<View className="items-center justify-center mt-6 opacity-60">
						<View className="bg-surface-secondary p-4 rounded-full mb-4">
							<StyledIcon name="map-pin" size={48} className="text-muted" />
						</View>
						<Text className="text-muted text-center text-lg font-bold">
							Nenhum uso registrado
						</Text>
						<Text className="text-muted text-center text-sm mt-1 px-10">
							Suas viagens aparecerão aqui para ajudar a calcular a autonomia
							real.
						</Text>
					</View>
				}
				renderSectionHeader={({ section: { title } }) => (
					<View className="bg-background/90">
						<Text className="text-xs font-black text-muted uppercase tracking-widest">
							{title}
						</Text>
					</View>
				)}
				renderItem={({ item, index }) => (
					<Animated.View entering={FadeInRight.delay(index * 50).springify()}>
						<Card
							variant="secondary"
							className="border border-surface-secondary bg-surface shadow-sm py-4"
						>
							<View className="flex-row items-center justify-between mb-3">
								<View className="flex-row items-center gap-3">
									<View className="bg-success/10 p-3 rounded-xl border border-success/20">
										<StyledIcon name="map" size={20} className="text-success" />
									</View>
									<View>
										<View className="flex-row items-baseline gap-1">
											<Text className="text-xl font-black text-foreground">
												{item.distance.toFixed(1)}
											</Text>
											<Text className="font-bold text-muted text-[10px]">
												km
											</Text>
										</View>
										<Text className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5 capitalize">
											{format(item.date, "HH:mm", { locale: ptBR })}
										</Text>
									</View>
								</View>

								<View className="flex-row gap-2">
									<Button
										size="sm"
										isIconOnly
										variant="secondary"
										className="bg-surface-secondary/50 border-transparent rounded-xl"
										onPress={() => handleEdit(item)}
									>
										<StyledIcon
											name="edit-2"
											size={14}
											className="text-foreground"
										/>
									</Button>
									<Button
										size="sm"
										isIconOnly
										variant="secondary"
										className="bg-danger/10 border-transparent rounded-xl"
										onPress={() => setLogToDelete(item.id)}
									>
										<StyledIcon
											name="trash-2"
											size={14}
											className="text-danger"
										/>
									</Button>
								</View>
							</View>
							<View className="bg-surface-secondary/30 rounded-xl p-3 flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<StyledIcon
										name="battery"
										size={14}
										className="text-success"
									/>
									<Text className="text-xs font-bold text-muted">
										Bateria no fim
									</Text>
								</View>
								<Text className="text-sm font-black text-success">
									{item.batteryLevel}
									<Text className="text-[10px] font-bold text-success/80">
										{scooter.trackingMode === "percent" ? "%" : "V"}
									</Text>
								</Text>
							</View>
							{item.notes ? (
								<View className="mt-3 px-1">
									<Text className="text-xs text-muted italic">
										"{item.notes}"
									</Text>
								</View>
							) : null}
						</Card>
					</Animated.View>
				)}
			/>

			{/* FLOATING ACTION BUTTON (FAB) */}
			<Animated.View
				entering={FadeInDown.delay(500).springify()}
				className="absolute bottom-6 right-6"
			>
				<Button
					size="lg"
					isIconOnly
					variant="primary"
					className="rounded-full shadow-lg bg-success border-0 h-16 w-16 shadow-success/40"
					style={{
						elevation: 10,
						shadowColor: "#10b981",
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.5,
						shadowRadius: 12,
					}}
					onPress={() => {
						setLogToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={28} color="white" />
				</Button>
			</Animated.View>

			<TripFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={refresh}
				editItem={logToEdit}
				scooter={scooter}
			/>

			<ConfirmDialog
				isOpen={logToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setLogToDelete(null);
				}}
				title="Excluir Uso"
				description="Tem certeza? A exclusão afeta os cálculos de autonomia da scooter."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
