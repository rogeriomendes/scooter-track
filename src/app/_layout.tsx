import { db } from "@/db/client";
import migrations from "@/drizzle/migrations";
import { useAppStore } from "@/store/useAppStore";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "expo-router/react-navigation";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Uniwind } from "uniwind";

import "../global.css";

export default function RootLayout() {
	const { success, error } = useMigrations(db, migrations);
	const theme = useAppStore((state) => state.theme);
	const systemColorScheme = useColorScheme();

	const isDark =
		theme === "dark" || (theme === "system" && systemColorScheme === "dark");

	useEffect(() => {
		// Sincroniza o tema do Zustand com o motor do Tailwind (Uniwind)
		Uniwind.setTheme(theme);
	}, [theme]);

	if (error) {
		return (
			<View className="flex-1 items-center justify-center p-6 bg-danger-50">
				<Text className="text-danger-500 text-lg font-bold">
					Erro de Migração DB:
				</Text>
				<Text className="text-danger-900 mt-2">{error.message}</Text>
			</View>
		);
	}

	if (!success) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="text-foreground">Carregando Banco de Dados...</Text>
			</View>
		);
	}

	return (
		<ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<HeroUINativeProvider>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="(tabs)" />
					</Stack>
				</HeroUINativeProvider>
			</GestureHandlerRootView>
		</ThemeProvider>
	);
}
