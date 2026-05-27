import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function TabLayout() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter } = useScooterData(activeScooterId);

	const backgroundColor = useThemeColor("background") as unknown as string;
	const surfaceColor = useThemeColor("surface") as unknown as string;
	const border = useThemeColor("border") as unknown as string;
	const accentColor = useThemeColor("success") as unknown as string; // Screenshots use Green as active color!
	const mutedColor = useThemeColor("muted") as unknown as string;
	const foregroundColor = useThemeColor("foreground") as unknown as string;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				headerShadowVisible: false,
				tabBarActiveTintColor: accentColor,
				tabBarInactiveTintColor: mutedColor,
				tabBarStyle: {
					backgroundColor: surfaceColor,
					borderTopColor: border,
					elevation: 0,
					borderTopWidth: 1,
				},
				headerStyle: {
					backgroundColor: backgroundColor,
					elevation: 0,
					shadowOpacity: 0,
				},
				headerTitleStyle: {
					color: foregroundColor,
					fontWeight: "bold",
					fontSize: 24,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, size }) => (
						<Feather name="activity" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="trips"
				options={{
					title: "Usos",
					tabBarIcon: ({ color, size }) => (
						<Feather name="navigation" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="charges"
				options={{
					title: "Recargas",
					tabBarIcon: ({ color, size }) => (
						<Feather name="zap" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="reports"
				options={{
					title: "Gráficos",
					tabBarIcon: ({ color, size }) => (
						<Feather name="bar-chart-2" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="maintenance"
				options={{
					title: "Manut.",
					href: scooter && scooter.showMaintenance ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Feather name="tool" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Config.",
					tabBarIcon: ({ color, size }) => (
						<Feather name="settings" color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
