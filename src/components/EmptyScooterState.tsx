import { Button } from "heroui-native/button";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ScooterFormSheet } from "@/components/ScooterFormSheet";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { useAppStore } from "@/store/useAppStore";
import { performRestore } from "@/utils/backupRestore";

interface EmptyScooterStateProps {
	title?: string;
	description?: string;
}

export function EmptyScooterState({
	title = "Bem-vindo!",
	description = "Você ainda não tem nenhuma scooter cadastrada. Adicione sua primeira scooter para começar a monitorar suas viagens e cargas.",
}: EmptyScooterStateProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);
	const { setActiveScooterId, triggerRefresh } = useAppStore();

	const handleRestoreBackup = async () => {
		setIsRestoring(true);
		try {
			await performRestore({
				onScooterRestored: (id) => setActiveScooterId(id),
				onSuccess: async () => {
					triggerRefresh();
				},
			});
		} finally {
			setIsRestoring(false);
		}
	};

	return (
		<ScreenWrapper className="justify-center items-center px-6">
			<View className="items-center justify-center w-full max-w-sm">
				<View className="bg-surface-secondary p-6 rounded-full mb-6 shadow-lg border border-surface">
					<StyledIcon name="zap" size={64} className="text-success" />
				</View>

				<Text className="text-3xl font-black text-foreground text-center mb-2">
					{title}
				</Text>
				<Text className="text-base text-muted text-center mb-8 px-4">
					{description}
				</Text>

				<View className="w-full gap-3">
					<Button
						variant="primary"
						size="lg"
						onPress={() => setIsOpen(true)}
						className="w-full shadow-lg"
						isDisabled={isRestoring}
					>
						<Button.Label className="font-bold text-base text-white">
							Cadastrar Scooter
						</Button.Label>
						<StyledIcon name="plus" size={18} className="ml-2 text-white" />
					</Button>

					<Button
						variant="outline"
						size="lg"
						onPress={handleRestoreBackup}
						className="w-full border-surface-secondary bg-surface/50"
						isDisabled={isRestoring}
					>
						{isRestoring ? (
							<ActivityIndicator size="small" color="#10b981" />
						) : (
							<>
								<StyledIcon
									name="download"
									size={18}
									className="mr-2 text-foreground"
								/>
								<Button.Label className="font-semibold text-base text-foreground">
									Restaurar Backup
								</Button.Label>
							</>
						)}
					</Button>
				</View>
			</View>

			<ScooterFormSheet
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				onSaved={() => setIsOpen(false)}
			/>
		</ScreenWrapper>
	);
}
