import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { View } from "react-native";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { FormDateTimeField } from "@/components/FormDateTimeField";

interface MaintenanceIntervalFieldsProps {
	type: "km" | "months" | "date" | "mixed";
	intervalKm: string;
	setIntervalKm: (val: string) => void;
	intervalMonths: string;
	setIntervalMonths: (val: string) => void;
	lastDate: Date;
	onChangeLastDate: (date: Date) => void;
	targetDate: Date;
	onChangeTargetDate: (date: Date) => void;
	isReadOnly: boolean;
}

export function MaintenanceIntervalFields({
	type,
	intervalKm,
	setIntervalKm,
	intervalMonths,
	setIntervalMonths,
	lastDate,
	onChangeLastDate,
	targetDate,
	onChangeTargetDate,
	isReadOnly,
}: MaintenanceIntervalFieldsProps) {
	if (type === "km") {
		return (
			<TextField>
				<Label>Intervalo de Troca (KM)</Label>
				<BottomSheetInput
					placeholder="Ex: 1000"
					keyboardType="numeric"
					value={intervalKm}
					onChangeText={setIntervalKm}
					editable={!isReadOnly}
					variant="secondary"
				/>
			</TextField>
		);
	}

	if (type === "months") {
		return (
			<View className="flex-row gap-3">
				<FormDateTimeField
					label="Data de Início"
					value={lastDate}
					disabled={isReadOnly}
					onChange={onChangeLastDate}
				/>
				<TextField className="flex-1">
					<Label>Intervalo (Meses)</Label>
					<BottomSheetInput
						placeholder="Ex: 6"
						keyboardType="numeric"
						value={intervalMonths}
						onChangeText={setIntervalMonths}
						editable={!isReadOnly}
						variant="secondary"
					/>
				</TextField>
			</View>
		);
	}

	if (type === "date") {
		return (
			<View className="flex-row gap-3">
				<FormDateTimeField
					label="Data de Início"
					value={lastDate}
					disabled={isReadOnly}
					onChange={onChangeLastDate}
				/>
				<FormDateTimeField
					label="Data Vencimento"
					value={targetDate}
					disabled={isReadOnly}
					onChange={onChangeTargetDate}
				/>
			</View>
		);
	}

	return (
		<View className="gap-3">
			<View className="flex-row gap-3">
				<FormDateTimeField
					label="Data de Início"
					value={lastDate}
					disabled={isReadOnly}
					onChange={onChangeLastDate}
				/>
				<TextField className="flex-1">
					<Label>Intervalo (KM)</Label>
					<BottomSheetInput
						placeholder="Ex: 1000"
						keyboardType="numeric"
						value={intervalKm}
						onChangeText={setIntervalKm}
						editable={!isReadOnly}
						variant="secondary"
					/>
				</TextField>
			</View>

			<TextField>
				<Label>Intervalo (Meses)</Label>
				<BottomSheetInput
					placeholder="Ex: 6"
					keyboardType="numeric"
					value={intervalMonths}
					onChangeText={setIntervalMonths}
					editable={!isReadOnly}
					variant="secondary"
				/>
			</TextField>
		</View>
	);
}
