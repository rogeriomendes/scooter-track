import React, { type ReactNode } from "react";
import { View } from "react-native";
import { StatCard, type StatCardProps } from "@/components/StatCard";

export interface StatGridProps {
	items?: StatCardProps[];
	children?: ReactNode;
	className?: string;
}

export function StatGrid({ items, children, className = "" }: StatGridProps) {
	const containerClass = `gap-2 w-full ${className}`.trim();

	if (children) {
		const childArray = React.Children.toArray(children);
		const rows: ReactNode[][] = [];
		for (let i = 0; i < childArray.length; i += 2) {
			rows.push(childArray.slice(i, i + 2));
		}
		return (
			<View className={containerClass}>
				{rows.map((row, rowIdx) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Fixed 2-item rows
					<View key={rowIdx} className="flex-row gap-2 w-full">
						{row}
					</View>
				))}
			</View>
		);
	}

	if (!items || items.length === 0) return null;

	const rows: StatCardProps[][] = [];
	for (let i = 0; i < items.length; i += 2) {
		rows.push(items.slice(i, i + 2));
	}

	return (
		<View className={containerClass}>
			{rows.map((row, rowIdx) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Fixed 2-item rows
				<View key={rowIdx} className="flex-row gap-2 w-full">
					{row.map((item, itemIdx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Stat cards within fixed row
						<StatCard key={itemIdx} {...item} />
					))}
				</View>
			))}
		</View>
	);
}
