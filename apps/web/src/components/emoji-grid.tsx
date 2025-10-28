"use client";

import EmojiPicker from "emoji-picker-react";
import { Activity, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";


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
		<div className="relative">
			<div className="rounded-2xl border-2 border-slate-200 bg-linear-to-br from-white to-slate-50 p-8 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="flex items-center gap-2 font-bold text-slate-800 text-xl">
						<Sparkles className="h-5 w-5 text-blue-600" />
						Emoji Canvas
					</h2>
					<Badge variant="outline" className="gap-2">
						<Activity className="h-3 w-3" />
						{submittedCells.size} / 100 cells
					</Badge>
				</div>

				<div className="grid grid-cols-10 gap-2 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 p-6 shadow-inner">
					{grid.map((cell) => (
						<button
							key={cell.id}
							type="button"
							onClick={() => handleCellClick(cell.id)}
							onMouseEnter={() => setHoveredCell(cell.id)}
							onMouseLeave={() => setHoveredCell(null)}
							disabled={submittedCells.has(cell.id) || disabled}
							className={`flex aspect-square items-center justify-center rounded-lg border-2 font-bold text-2xl transition-all duration-200 ${getCellClasses(
								cell.id
							)}`}
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

				{selectedCell !== null && (
					<div className="-translate-x-1/2 absolute top-full left-1/2 z-50 mt-4">
						<div className="fade-in zoom-in animate-in duration-200">
							<EmojiPicker
								onEmojiClick={(emojiData) => {
									handleCellSubmit(selectedCell, emojiData.emoji);
									setSelectedCell(null);
								}}
							/>
						</div>
					</div>
				)}
			</div>

			{disabled && (
				<div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10 backdrop-blur-sm">
					<div className="rounded-xl bg-white px-6 py-3 shadow-xl">
						<p className="font-semibold text-slate-700">
							⏳ Cooldown in progress...
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
