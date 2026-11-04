import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeType = "light" | "dark" | "system";

interface AppState {
	activeScooterId: number | null;
	theme: ThemeType;
	refreshCounter: number;
	costPerKwh: number; // Ex: R$ 0.85
	gasPricePerLiter: number; // Ex: R$ 5.90 para comparativo de economia
	setActiveScooterId: (id: number | null) => void;
	setTheme: (theme: ThemeType) => void;
	triggerRefresh: () => void;
	setCostPerKwh: (cost: number) => void;
	setGasPricePerLiter: (price: number) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			activeScooterId: null,
			theme: "system",
			refreshCounter: 0,
			costPerKwh: 0.85,
			gasPricePerLiter: 5.9,
			setActiveScooterId: (id) => set({ activeScooterId: id }),
			setTheme: (theme) => set({ theme }),
			triggerRefresh: () =>
				set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
			setCostPerKwh: (costPerKwh) => set({ costPerKwh }),
			setGasPricePerLiter: (gasPricePerLiter) => set({ gasPricePerLiter }),
		}),
		{
			name: "scootertrack-storage",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
