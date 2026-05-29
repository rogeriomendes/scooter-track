import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { BottomSheet } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface ScooterPickerSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ScooterPickerSheet({
	isOpen,
	onOpenChange,
}: ScooterPickerSheetProps) {
	const { activeScooterId, setActiveScooterId } = useAppStore();
	const [scootersList, setScootersList] = useState<
		(typeof scooters.$inferSelect)[]
	>([]);

	useEffect(() => {
		if (isOpen) {
			const fetchScooters = async () => {
				const data = await db.select().from(scooters);
				setScootersList(data);
			};
			fetchScooters();
		}
	}, [isOpen]);

	const handleSelect = (id: number) => {
		setActiveScooterId(id);
		onOpenChange(false);
	};

	return (
		<BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Content>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4 px-2">
						Trocar de Scooter
					</BottomSheet.Title>

					{scootersList.map((item) => {
						const isActive = activeScooterId === item.id;
						return (
							<Pressable
								key={item.id}
								onPress={() => handleSelect(item.id)}
								className={`flex-row items-center justify-between p-4 mb-2 rounded-2xl border ${
									isActive
										? "border-success bg-success/10"
										: "border-surface-secondary bg-surface"
								}`}
							>
								<View className="flex-row items-center gap-3">
									<View
										className={`p-2.5 rounded-xl ${
											isActive ? "bg-success" : "bg-surface-secondary"
										}`}
									>
										<StyledIcon
											name="navigation"
											size={18}
											className={isActive ? "text-white" : "text-muted"}
										/>
									</View>
									<View>
										<Text className="text-base font-bold text-foreground">
											{item.name}
										</Text>
										{isActive && (
											<Text className="text-[10px] text-success font-bold uppercase tracking-wider mt-0.5">
												Ativa agora
											</Text>
										)}
									</View>
								</View>

								{isActive && (
									<StyledIcon
										name="check-circle"
										size={20}
										className="text-success"
									/>
								)}
							</Pressable>
						);
					})}
				</BottomSheet.Content>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
