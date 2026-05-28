import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter } = useScooterData(activeScooterId);
	const { bottom } = useSafeAreaInsets();

	const backgroundColor = useThemeColor("background") as unknown as string;
	const surfaceColor = useThemeColor("surface") as unknown as string;
	const border = useThemeColor("border") as unknown as string;
	const accentColor = useThemeColor("success") as unknown as string;
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
					height: 55 + bottom,
					paddingBottom: 15 + bottom,
					paddingTop: 5,
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
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "home" : "home-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="trips"
				options={{
					title: "Usos",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "map" : "map-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="charges"
				options={{
					title: "Recargas",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "flash" : "flash-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="reports"
				options={{
					title: "Gráficos",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "stats-chart" : "stats-chart-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="maintenance"
				options={{
					title: "Manut.",
					href: scooter && scooter.showMaintenance ? undefined : null,
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "build" : "build-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Config.",
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? "settings" : "settings-outline"}
							color={color}
							size={20}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
