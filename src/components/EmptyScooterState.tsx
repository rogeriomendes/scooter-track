import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { ScooterFormSheet } from "@/screens/Settings/components/ScooterFormSheet";
import { Button } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface EmptyScooterStateProps {
	title?: string;
	description?: string;
}

export function EmptyScooterState({
	title = "Bem-vindo!",
	description = "Você ainda não tem nenhuma scooter cadastrada. Adicione sua primeira scooter para começar a monitorar suas viagens e cargas.",
}: EmptyScooterStateProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<ScreenWrapper className="justify-center items-center px-6">
			<Animated.View
				entering={FadeInDown.springify()}
				className="items-center justify-center w-full"
			>
				<View className="bg-surface-secondary p-6 rounded-full mb-6 shadow-lg border border-surface">
					<StyledIcon name="zap" size={64} className="text-success" />
				</View>

				<Text className="text-3xl font-black text-foreground text-center mb-2">
					{title}
				</Text>
				<Text className="text-base text-muted text-center mb-8 px-4">
					{description}
				</Text>

				<Button
					variant="primary"
					size="lg"
					onPress={() => setIsOpen(true)}
					className="w-full shadow-lg"
				>
					<Button.Label className="font-bold text-lg text-white">
						Cadastrar Scooter
					</Button.Label>
					<StyledIcon name="plus" size={20} className="ml-2 text-white" />
				</Button>
			</Animated.View>

			<ScooterFormSheet
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				onSaved={() => setIsOpen(false)}
			/>
		</ScreenWrapper>
	);
}
