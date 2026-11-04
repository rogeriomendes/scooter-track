import { Button } from "heroui-native/button";
import { View } from "react-native";
import { FormDateTimeField } from "@/components/FormDateTimeField";

interface MaintenanceResetWearSectionProps {
	resetWear: boolean;
	onToggleResetWear: () => void;
	completedDate: Date;
	onChangeCompletedDate: (date: Date) => void;
}

export function MaintenanceResetWearSection({
	resetWear,
	onToggleResetWear,
	completedDate,
	onChangeCompletedDate,
}: MaintenanceResetWearSectionProps) {
	return (
		<View className="mt-3 bg-surface-secondary/40 rounded-xl p-3 border border-surface-secondary gap-2">
			<Button
				variant={resetWear ? "primary" : "secondary"}
				onPress={onToggleResetWear}
			>
				<Button.Label>
					{resetWear
						? "✓ Revisão realizada (Zerar desgaste)"
						: "Marcar revisão/troca como realizada"}
				</Button.Label>
			</Button>

			{resetWear && (
				<FormDateTimeField
					label="Data da Realização"
					value={completedDate}
					className="mt-1"
					onChange={onChangeCompletedDate}
				/>
			)}
		</View>
	);
}
