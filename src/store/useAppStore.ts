import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeType = "light" | "dark" | "system";

export type WeatherData = {
	temperature_2m: number;
	relative_humidity_2m: number;
	weather_code: number;
	wind_speed_10m: number;
	is_day: number;
	apparent_temperature: number;
	wind_gusts_10m: number;
	precipitation_probability: number;
	next_day_max: number;
	next_day_min: number;
	fetchTime: number;
};

interface AppState {
	activeScooterId: number | null;
	theme: ThemeType;
	refreshCounter: number;
	weatherData: WeatherData | null;
	setActiveScooterId: (id: number | null) => void;
	setTheme: (theme: ThemeType) => void;
	triggerRefresh: () => void;
	setWeatherData: (data: WeatherData | null) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			activeScooterId: null,
			theme: "system",
			refreshCounter: 0,
			weatherData: null,
			setActiveScooterId: (id) => set({ activeScooterId: id }),
			setTheme: (theme) => set({ theme }),
			triggerRefresh: () =>
				set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
			setWeatherData: (data) => set({ weatherData: data }),
		}),
		{
			name: "scootertrack-storage",
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
