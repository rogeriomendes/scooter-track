import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { Button } from "heroui-native";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { ChargeFormSheet } from "./components/ChargeFormSheet";

export default function ChargesScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, stats, isLoading } =
		useScooterData(activeScooterId);

	const [currentMonth, setCurrentMonth] = useState(
		new Date(new Date().getFullYear(), new Date().getMonth(), 1),
	);
	const [page, setPage] = useState(1);
	const itemsPerPage = 20;

	const chargesList = useMemo(() => {
		return allLogs.filter((l) => {
			if (l.type !== "charge") return false;
			const logDate = new Date(l.date);
			return (
				logDate.getMonth() === currentMonth.getMonth() &&
				logDate.getFullYear() === currentMonth.getFullYear()
			);
		});
	}, [allLogs, currentMonth]);

	const displayedCharges = useMemo(
		() => chargesList.slice(0, page * itemsPerPage),
		[chargesList, page],
	);

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
				title="Recargas"
				description="Adicione uma scooter primeiro para registrar recargas."
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
					Recargas
				</Animated.Text>
				<Animated.Text
					entering={FadeInDown.delay(200).springify()}
					className="text-xs font-bold text-muted uppercase tracking-wider"
				>
					{scooter.name}
				</Animated.Text>
			</View>

			{/* ESTATÍSTICAS RÁPIDAS */}
			<Animated.View
				entering={FadeInDown.delay(300).springify()}
				className="flex-row gap-3 px-4 mb-4 mt-2"
			>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
				>
					<StyledIcon name="zap" size={18} className="mb-2 text-info" />
					<Text className="text-xl font-black text-foreground">
						{chargesList.length}
					</Text>
					<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
						Mês Atual
					</Text>
				</Card>

				<Card
					variant="secondary"
					className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
				>
					<StyledIcon
						name="navigation"
						size={18}
						className="mb-2 text-success"
					/>
					<View className="flex-row items-baseline gap-1">
						<Text className="text-xl font-black text-foreground">
							{stats?.averageCycleKm.toFixed(1) || "0.0"}
						</Text>
						<Text className="font-bold text-muted text-[10px]">km</Text>
					</View>
					<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
						Média/Ciclo
					</Text>
				</Card>

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
							{stats?.bestCycleKm.toFixed(1) || "0.0"}
						</Text>
						<Text className="font-bold text-muted text-[10px]">km</Text>
					</View>
					<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
						Melhor Ciclo
					</Text>
				</Card>
			</Animated.View>

			{/* SELETOR DE MÊS (Chips) */}
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

			{/* LISTA DE RECARGAS */}
			<FlatList
				data={displayedCharges}
				onEndReached={() => {
					if (displayedCharges.length < chargesList.length) {
						setPage((p) => p + 1);
					}
				}}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					displayedCharges.length < chargesList.length ? (
						<ActivityIndicator size="small" color="#10b981" className="py-4" />
					) : null
				}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 gap-3 pt-2"
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<View className="items-center justify-center mt-10 opacity-60">
						<View className="bg-surface-secondary p-4 rounded-full mb-4">
							<StyledIcon name="zap" size={48} className="text-muted" />
						</View>
						<Text className="text-muted text-center text-lg font-bold">
							Nenhuma recarga registrada
						</Text>
						<Text className="text-muted text-center text-sm mt-1 px-10">
							Sempre que recarregar a bateria, adicione aqui para manter o
							controle.
						</Text>
					</View>
				}
				renderItem={({ item, index }) => {
					const cycle = stats?.cycles.find((c) => c.chargeLog.id === item.id);
					const autonomia = cycle ? cycle.distance.toFixed(1) : "0.0";

					return (
						<Animated.View
							entering={FadeInRight.delay(index * 100).springify()}
						>
							<Card
								variant="secondary"
								className="border border-surface-secondary bg-surface shadow-sm p-0"
							>
								<Pressable 
									className="py-4 px-4" 
									onPress={() => handleEdit(item)}
								>
									<View className="flex-row items-start justify-between">
										<View className="flex-row items-start gap-3 flex-1">
											<View className="bg-info/10 p-2.5 rounded-xl border border-info/20 mt-0.5">
												<StyledIcon name="zap" size={18} className="text-info" />
											</View>
											<View className="flex-1">
												<View className="flex-row items-baseline gap-1">
													<Text className="text-lg font-black text-foreground">
														{item.batteryLevel}
													</Text>
													<Text className="font-bold text-muted text-xs">
														{scooter.trackingMode === "percent" ? "%" : "V"}
													</Text>
													{scooter.trackingMode === "voltage" && (
														<Text className="font-bold text-muted text-xs ml-1">
															({calculateBatteryPercentage(item.batteryLevel, scooter.batteryType)}%)
														</Text>
													)}
												</View>
												<View className="flex-row items-center gap-1.5 mt-0.5">
													<StyledIcon name="navigation" size={10} className="text-success" />
													<Text className="text-xs font-bold text-muted">
														Recuperou: <Text className="text-success">+{autonomia} km</Text>
													</Text>
												</View>
											</View>
										</View>
										
										<View className="items-end">
											<Text className="text-[10px] text-muted font-bold uppercase tracking-widest">
												{format(item.date, "dd MMM • HH:mm", { locale: ptBR })}
											</Text>
										</View>
									</View>
									
									{item.notes ? (
										<View className="mt-3 pl-[46px]">
											<Text className="text-xs text-muted italic">"{item.notes}"</Text>
										</View>
									) : null}
								</Pressable>
							</Card>
						</Animated.View>
					);
				}}
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

			<ChargeFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={refresh}
				onDeleteRequest={(id) => {
					setIsBottomSheetOpen(false);
					setLogToDelete(id);
				}}
				editItem={logToEdit}
				scooter={scooter}
			/>

			<ConfirmDialog
				isOpen={logToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setLogToDelete(null);
				}}
				title="Excluir Recarga"
				description="Tem certeza? A exclusão afeta os cálculos de autonomia da scooter."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
