import { addMonths, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { maintenance } from "@/db/schema";

export type MaintenanceItem = typeof maintenance.$inferSelect;

export interface MaintenanceWearResult {
	wornKm: number;
	remainingKm: number;
	wearPercentageKm: number;
	wearPercentageMonths: number;
	remainingDaysMonths: number;
	wearPercentageFixedDate: number;
	remainingDaysFixedDate: number;
	wearPercentage: number;
	primaryInfo: string;
	secondaryInfo: string;
	isPriority: boolean;
	pInfo: string;
	sInfo: string;
}

export function calculateMaintenanceWear(
	item: MaintenanceItem,
	currentTotalKm: number,
): MaintenanceWearResult {
	const itemType = item.type || "km";

	const wornKm = currentTotalKm - item.lastMaintenanceKm;
	const remainingKm = Math.max(0, item.intervalKm - wornKm);
	const wearPercentageKm =
		item.intervalKm > 0 ? (wornKm / item.intervalKm) * 100 : 0;

	let wearPercentageMonths = 0;
	let remainingDaysMonths = 0;
	if (item.lastMaintenanceDate && item.intervalMonths) {
		const nextDate = addMonths(item.lastMaintenanceDate, item.intervalMonths);
		const totalDays = differenceInDays(nextDate, item.lastMaintenanceDate) || 1;
		const daysPassed = differenceInDays(new Date(), item.lastMaintenanceDate);
		remainingDaysMonths = Math.max(0, totalDays - daysPassed);
		wearPercentageMonths = (daysPassed / totalDays) * 100;
	}

	let wearPercentageFixedDate = 0;
	let remainingDaysFixedDate = 0;
	if (item.targetDate && item.lastMaintenanceDate) {
		const totalDays =
			differenceInDays(item.targetDate, item.lastMaintenanceDate) || 1;
		const daysPassed = differenceInDays(new Date(), item.lastMaintenanceDate);
		remainingDaysFixedDate = Math.max(0, totalDays - daysPassed);
		wearPercentageFixedDate = (daysPassed / totalDays) * 100;
	}

	let wearPercentage = 0;
	let primaryInfo = "";
	let secondaryInfo = "";
	let isPriority = false;
	let pInfo = "";
	let sInfo = "";

	if (itemType === "km") {
		wearPercentage = wearPercentageKm;
		primaryInfo = `Restam ${remainingKm.toFixed(0)} km`;
		secondaryInfo = `A CADA ${item.intervalKm} KM`;
		pInfo = `${remainingKm.toFixed(0)}`;
		sInfo = "km restantes";
		if (remainingKm <= 50) isPriority = true;
	} else if (itemType === "months") {
		wearPercentage = wearPercentageMonths;
		primaryInfo = `Faltam ${remainingDaysMonths} dias`;
		secondaryInfo = `A CADA ${item.intervalMonths} MESES`;
		pInfo = `${remainingDaysMonths}`;
		sInfo = "dias restantes";
		if (remainingDaysMonths <= 15) isPriority = true;
	} else if (itemType === "date") {
		wearPercentage = wearPercentageFixedDate;
		primaryInfo = `Faltam ${remainingDaysFixedDate} dias`;
		secondaryInfo = `VENCE EM ${format(item.targetDate || new Date(), "dd/MM/yyyy", { locale: ptBR })}`;
		pInfo = `${remainingDaysFixedDate}`;
		sInfo = "dias restantes";
		if (remainingDaysFixedDate <= 15) isPriority = true;
	} else if (itemType === "mixed") {
		wearPercentage = Math.max(wearPercentageKm, wearPercentageMonths);
		if (wearPercentageKm > wearPercentageMonths) {
			primaryInfo = `Restam ${remainingKm.toFixed(0)} km`;
			secondaryInfo = `OU ${remainingDaysMonths} DIAS`;
			pInfo = `${remainingKm.toFixed(0)}`;
			sInfo = "km restantes";
		} else {
			primaryInfo = `Faltam ${remainingDaysMonths} dias`;
			secondaryInfo = `OU ${remainingKm.toFixed(0)} KM`;
			pInfo = `${remainingDaysMonths}`;
			sInfo = "dias restantes";
		}
		if (remainingKm <= 50 || remainingDaysMonths <= 15) isPriority = true;
	}

	const clampedWear = Math.min(100, Math.max(0, wearPercentage));

	return {
		wornKm,
		remainingKm,
		wearPercentageKm,
		wearPercentageMonths,
		remainingDaysMonths,
		wearPercentageFixedDate,
		remainingDaysFixedDate,
		wearPercentage: clampedWear,
		primaryInfo,
		secondaryInfo,
		isPriority,
		pInfo,
		sInfo,
	};
}
