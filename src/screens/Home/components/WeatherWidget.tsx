import * as Location from "expo-location";
import { Popover } from "heroui-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { StyledIcon } from "@/components/StyledIcon";
import { useAppStore } from "@/store/useAppStore";

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

function WeatherMetricChip({
	icon,
	value,
	color,
	tooltip,
}: {
	icon: StyledIcon;
	value: string;
	color: string;
	tooltip: string;
}) {
	return (
		<Popover>
			<Popover.Trigger>
				<View className="flex-row items-center justify-start gap-1.5 px-2 py-1">
					<StyledIcon name={icon} size={12} className={color} />
					<Text className="text-[11px] font-bold text-muted">{value}</Text>
				</View>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					presentation="popover"
					placement="top"
					className="bg-surface border border-border rounded-lg px-3 py-2"
				>
					<Popover.Arrow />
					<Text className="text-xs font-medium text-foreground">{tooltip}</Text>
				</Popover.Content>
			</Popover.Portal>
		</Popover>
	);
}

export function WeatherWidget() {
	const { weatherData: weather, setWeatherData } = useAppStore();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: initial fetch on mount only
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
					`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day,apparent_temperature,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
				);
				const data = await res.json();

				if (data.current && data.daily) {
					setWeatherData({
						...data.current,
						precipitation_probability:
							data.daily.precipitation_probability_max[0] || 0,
						next_day_max: data.daily.temperature_2m_max[1] || 0,
						next_day_min: data.daily.temperature_2m_min[1] || 0,
						fetchTime: Date.now(),
					});
				} else {
					console.warn("Weather API Error:", data);
					if (!weather) setErrorMsg("Erro na API");
				}
			} catch (err) {
				console.warn("Weather Fetch Error:", err);
				if (!weather) setErrorMsg("Erro de rede");
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading && !weather) {
		return (
			<View className="p-4 mb-4 items-center justify-center">
				<ActivityIndicator size="small" color="#888" />
			</View>
		);
	}

	if (errorMsg || !weather) {
		return (
			<View className="p-4 mb-4 items-center justify-center">
				<Text className="text-muted text-xs">{errorMsg || "Sem dados"}</Text>
			</View>
		);
	}

	const info = getWeatherInfo(weather.weather_code, weather.is_day);

	return (
		<Animated.View
			entering={FadeInDown.delay(300).springify()}
			className="p-4 mb-4 flex-row items-center justify-between bg-surface/60 rounded-2xl"
		>
			<View className="flex-row items-center gap-3 flex-1">
				<View className="p-2.5">
					<StyledIcon
						name={info.icon as StyledIcon}
						size={28}
						className={info.color}
					/>
				</View>
				<View className="flex-1">
					<Text
						className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5"
						numberOfLines={1}
					>
						{info.text}
					</Text>
					<View className="flex-row items-center gap-2">
						<Text className="text-2xl font-black text-foreground">
							{Math.round(weather.temperature_2m)}°C
						</Text>
						{loading && <ActivityIndicator size={12} color="#888" />}
					</View>
					<Text
						className="text-[10px] font-medium text-muted mt-0.5"
						numberOfLines={1}
					>
						Sens.: {Math.round(weather.apparent_temperature)}°C • Amanhã:{" "}
						{Math.round(weather.next_day_min)}°/
						{Math.round(weather.next_day_max)}°
					</Text>
				</View>
			</View>

			<View className="flex-row gap-1">
				<View className="gap-1">
					<WeatherMetricChip
						icon="cloud-rain"
						color="text-info"
						value={`${weather.precipitation_probability}%`}
						tooltip="Probabilidade de Chuva"
					/>
					<WeatherMetricChip
						icon="droplet"
						color="text-info"
						value={`${weather.relative_humidity_2m}%`}
						tooltip="Umidade do Ar"
					/>
				</View>
				<View className="gap-1">
					<WeatherMetricChip
						icon="wind"
						color="text-warning"
						value={`${weather.wind_gusts_10m} km/h`}
						tooltip="Rajadas de Vento"
					/>
					<WeatherMetricChip
						icon="wind"
						color="text-muted"
						value={`${weather.wind_speed_10m} km/h`}
						tooltip="Velocidade do Vento"
					/>
				</View>
			</View>
		</Animated.View>
	);
}
