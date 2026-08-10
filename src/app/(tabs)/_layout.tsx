import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";

export default function TabLayout() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter } = useScooterData(activeScooterId);

	const surfaceColor = useThemeColor("surface") as unknown as string;
	const accentColor = useThemeColor("success") as unknown as string;

	return (
		<NativeTabs
			labelVisibilityMode="labeled"
			backgroundColor={surfaceColor}
			tintColor={accentColor}
			indicatorColor={
				accentColor.startsWith("#")
					? `${accentColor}20`
					: "rgba(16, 185, 129, 0.2)"
			}
		>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />}
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="trips">
				<NativeTabs.Trigger.Label>Usos</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="map" />}
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="charges">
				<NativeTabs.Trigger.Label>Recargas</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="flash" />}
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="reports">
				<NativeTabs.Trigger.Label>Gráficos</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={
						<NativeTabs.Trigger.VectorIcon
							family={Ionicons}
							name="stats-chart"
						/>
					}
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger
				name="maintenance"
				hidden={!(scooter && scooter.showMaintenance)}
			>
				<NativeTabs.Trigger.Label>Manut.</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="build" />}
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
