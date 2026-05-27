import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function TabLayout() {
	const backgroundColor = useThemeColor(
		"background" as any,
	) as unknown as string;
	const surfaceColor = useThemeColor("surface" as any) as unknown as string;
	const border = useThemeColor("border" as any) as unknown as string;
	const accentColor = useThemeColor("success" as any) as unknown as string; // Screenshots use Green as active color!
	const mutedColor = useThemeColor("muted" as any) as unknown as string;
	const foregroundColor = useThemeColor(
		"foreground" as any,
	) as unknown as string;

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
