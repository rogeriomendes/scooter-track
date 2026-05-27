import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeType = "light" | "dark" | "system";

interface AppState {
	activeScooterId: number | null;
	theme: ThemeType;
	setActiveScooterId: (id: number | null) => void;
	setTheme: (theme: ThemeType) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			activeScooterId: null,
			theme: "system",
			setActiveScooterId: (id) => set({ activeScooterId: id }),
			setTheme: (theme) => set({ theme }),
		}),
		{
			name: "scootertrack-storage",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
