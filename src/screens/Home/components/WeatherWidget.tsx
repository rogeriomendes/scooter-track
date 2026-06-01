import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StyledIcon } from "@/components/StyledIcon";

type WeatherData = {
	temperature_2m: number;
	relative_humidity_2m: number;
	weather_code: number;
	wind_speed_10m: number;
	is_day: number;
};

function getWeatherInfo(code: number, isDay: number) {
	if (code === 0 || code === 1) {
		return {
			icon: isDay ? "sun" : "moon",
			text: "Clima ideal",
			color: "text-warning",
		};
	}
	if (code === 2 || code === 3) {
		return { icon: "cloud", text: "Nublado", color: "text-muted" };
	}
	if (code >= 45 && code <= 48) {
		return { icon: "cloud-drizzle", text: "Neblina", color: "text-muted" };
	}
	if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
		return { icon: "cloud-rain", text: "Pista molhada", color: "text-info" };
	}
	if (code >= 71 && code <= 77) {
		return { icon: "cloud-snow", text: "Frio extremo", color: "text-info" };
	}
	if (code >= 95) {
		return {
			icon: "cloud-lightning",
			text: "Tempestade",
			color: "text-danger",
		};
	}
	return {
		icon: "thermometer",
		text: "Bom para pilotar",
		color: "text-success",
	};
}

export function WeatherWidget() {
	const [weather, setWeather] = useState<WeatherData | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== "granted") {
					setErrorMsg("Sem perm.");
					setLoading(false);
					return;
				}

				const location = await Location.getCurrentPositionAsync({});
				const { latitude, longitude } = location.coords;

				const res = await fetch(
					`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day`,
				);
				const data = await res.json();

				if (data.current) {
					setWeather(data.current);
				} else {
					console.warn("Weather API Error:", data);
					setErrorMsg("Erro na API");
				}
			} catch (err) {
				console.warn("Weather Fetch Error:", err);
				setErrorMsg("Erro de rede");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) {
		return (
			<View className="bg-surface-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-surface-secondary mb-4 items-center justify-center">
				<ActivityIndicator size="small" color="#888" />
			</View>
		);
	}

	if (errorMsg || !weather) {
		return (
			<View className="bg-surface-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-surface-secondary mb-4 items-center justify-center">
				<Text className="text-muted text-xs">{errorMsg || "Sem dados"}</Text>
			</View>
		);
	}

	const info = getWeatherInfo(weather.weather_code, weather.is_day);

	return (
		<Animated.View
			entering={FadeInDown.delay(300).springify()}
			className="bg-surface-secondary/30 p-4 rounded-2xl border border-surface-secondary mb-6 flex-row items-center justify-between"
		>
			<View className="flex-row items-center gap-3">
				<View className="bg-background/80 p-2.5 rounded-2xl">
					<StyledIcon
						name={info.icon as any}
						size={28}
						className={info.color}
					/>
				</View>
				<View>
					<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
						{info.text}
					</Text>
					<Text className="text-2xl font-black text-foreground">
						{Math.round(weather.temperature_2m)}°C
					</Text>
				</View>
			</View>

			<View className="items-end gap-1.5">
				<View className="flex-row items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
					<StyledIcon name="wind" size={12} className="text-muted" />
					<Text className="text-xs font-bold text-muted">
						{weather.wind_speed_10m} km/h
					</Text>
				</View>
				<View className="flex-row items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
					<StyledIcon name="droplet" size={12} className="text-info" />
					<Text className="text-xs font-bold text-muted">
						{weather.relative_humidity_2m}% Umi
					</Text>
				</View>
			</View>
		</Animated.View>
	);
}
