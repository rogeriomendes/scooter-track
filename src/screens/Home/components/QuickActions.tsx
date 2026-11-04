import { Button } from "heroui-native/button";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export interface QuickActionsProps {
	onTripsPress: () => void;
	onChargesPress: () => void;
	onRangeCalcPress: () => void;
	invoicePdfPath?: string | null;
	onInvoicePress?: () => void;
}

export function QuickActions({
	onTripsPress,
	onChargesPress,
	onRangeCalcPress,
	invoicePdfPath,
	onInvoicePress,
}: QuickActionsProps) {
	return (
		<View>
			<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider ml-1">
				Ações
			</Text>
			<View className="gap-3 mb-4 flex-row w-full">
				<Button variant="primary" className="flex-1" onPress={onTripsPress}>
					<StyledIcon name="map-pin" size={18} className="text-white" />
					<Button.Label className="text-white">Uso</Button.Label>
				</Button>

				<Button variant="primary" className="flex-1" onPress={onChargesPress}>
					<StyledIcon name="zap" size={18} className="text-white" />
					<Button.Label className="text-white">Recarga</Button.Label>
				</Button>

				<Button variant="secondary" isIconOnly onPress={onRangeCalcPress}>
					<StyledIcon name="compass" size={20} className="text-success" />
				</Button>

				{invoicePdfPath && onInvoicePress ? (
					<Button variant="secondary" isIconOnly onPress={onInvoicePress}>
						<StyledIcon name="file-text" size={20} className="text-info" />
					</Button>
				) : null}
			</View>
		</View>
	);
}
