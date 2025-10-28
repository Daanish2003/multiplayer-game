"use client";

import EmojiPicker from "emoji-picker-react";
import {X } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

type Cell = {
	id: number;
	character: string;
	playerName?: string;
};

export function EmojiGrid({
	grid,
	submittedCells,
	handleCellSubmit,
	disabled,
}: {
	grid: Cell[];
	submittedCells: Set<number>;
	handleCellSubmit: (cellId: number, emoji: string) => void;
	disabled: boolean;
}) {
	const [selectedCell, setSelectedCell] = useState<number | null>(null);
	const [hoveredCell, setHoveredCell] = useState<number | null>(null);

	const handleCellClick = (cellId: number) => {
		if (!(submittedCells.has(cellId) || disabled)) {
			setSelectedCell(cellId);
		}
	};

	function getCellClasses(cellId: number) {
		if (disabled && !submittedCells.has(cellId)) {
			return "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50";
		}
		if (selectedCell === cellId) {
			return "border-blue-500 bg-blue-100 shadow-lg scale-110 z-10";
		}
		if (submittedCells.has(cellId)) {
			return "border-slate-200 bg-white shadow-sm";
		}
		if (hoveredCell === cellId) {
			return "cursor-pointer border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md scale-105";
		}
		return "cursor-pointer border-slate-200 bg-white hover:border-blue-300 shadow-sm";
	}

	return (
		<div className="relative space-y-3">
			{disabled && (
				<div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
					<p className="text-center font-semibold text-amber-800 text-xs sm:text-sm">
						⏳ Cooldown in progress - Please wait before placing another emoji
					</p>
				</div>
			)}

			<Card className="overflow-hidden">
				<CardContent className="p-2 xs:p-3 sm:p-4 md:p-6">
					{/* Responsive grid container with max-width to prevent oversizing */}
					<div className="mx-auto w-full max-w-[600px]">
						<div className="grid aspect-square w-full grid-cols-10 gap-0.5 xs:gap-1 rounded-lg xs:rounded-xl bg-linear-to-br from-slate-100 to-slate-200 p-1.5 xs:p-2 shadow-inner sm:gap-1.5 sm:p-3 md:gap-2 md:p-4">
							{grid.map((cell) => (
								<button
									key={cell.id}
									type="button"
									onClick={() => handleCellClick(cell.id)}
									onMouseEnter={() => setHoveredCell(cell.id)}
									onMouseLeave={() => setHoveredCell(null)}
									disabled={submittedCells.has(cell.id) || disabled}
									className={`flex aspect-square w-full items-center justify-center rounded border-2 text-base xs:text-lg transition-all duration-200 sm:rounded-md sm:text-xl md:rounded-lg md:text-2xl ${getCellClasses(cell.id)}`}
									title={
										cell.playerName
											? `${cell.playerName}: ${cell.character}`
											// biome-ignore lint/style/noNestedTernary: <>
											: disabled
												? "Wait for cooldown"
												: "Click to place emoji"
									}
								>
									{cell.character ||
										(hoveredCell === cell.id &&
											!disabled &&
											!submittedCells.has(cell.id) &&
											"+")}
								</button>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Responsive emoji picker modal */}
			{selectedCell !== null && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 xs:p-4">
					<div className="fade-in zoom-in relative w-full max-w-[95vw] xs:max-w-[90vw] animate-in duration-200 sm:max-w-md">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedCell(null)}
							className="-top-2 -right-2 absolute z-10 h-7 xs:h-8 w-7 xs:w-8 rounded-full p-0 shadow-lg"
						>
							<X className="h-3.5 xs:h-4 w-3.5 xs:w-4" />
						</Button>
						<div className="max-h-[70vh] xs:max-h-[80vh] overflow-auto rounded-lg shadow-2xl">
							<EmojiPicker
								onEmojiClick={(emojiData) => {
									handleCellSubmit(selectedCell, emojiData.emoji);
									setSelectedCell(null);
								}}
								width="100%"
								// biome-ignore lint/style/noMagicNumbers: <>
								height={Math.min(400, window.innerHeight * 0.6)}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}