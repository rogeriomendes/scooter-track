import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeType = "light" | "dark" | "system";

interface AppState {
	activeScooterId: number | null;
	theme: ThemeType;
	refreshCounter: number;
	setActiveScooterId: (id: number | null) => void;
	setTheme: (theme: ThemeType) => void;
	triggerRefresh: () => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			activeScooterId: null,
			theme: "system",
			refreshCounter: 0,
			setActiveScooterId: (id) => set({ activeScooterId: id }),
			setTheme: (theme) => set({ theme }),
			triggerRefresh: () => set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
		}),
		{
			name: "scootertrack-storage",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
