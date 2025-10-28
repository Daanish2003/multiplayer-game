"use client";

import { useGameSocket } from "@/hooks/use-game-socket";
import { useGameStore } from "@/store/use-game-store";
import { useEffect, useState } from "react";
import { OnlineBadge } from "./online-badge";
import { Button } from "./ui/button";
import { LogOut, Users, Sparkles, History, Clock } from "lucide-react";
import { EmojiGrid } from "./emoji-grid";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RestrictionTimer } from "./restriction-timer";
import { ScrollArea } from "@radix-ui/react-scroll-area";

const FIFTY = 50;

type Cell = {
	id: number;
	character: string;
	playerName?: string;
};

export default function GameRoom({ roomId }: { roomId: string }) {
	const {
		grid,
		players,
		onlineCount,
		hasSubmitted,
		cooldownTime,
		history = [],
	} = useGameStore();
	const { handleBlockSubmit, handleLeaveRoom, handleTimeTravel } =
		useGameSocket(roomId);
	const [restrictionTrigger, setRestrictionTrigger] = useState<number | null>(
		null
	);
	const [submittedCells, setSubmittedCells] = useState<Set<number>>(new Set());
	const gridCells: Cell[] = grid.flatMap((row, x) =>
		row.map((char, y) => ({
			id: x * 10 + y,
			character: char,
		}))
	);

	console.log(onlineCount);

	useEffect(() => {
		const newSubmittedCells = new Set<number>();
		grid.forEach((row, x) => {
			row.forEach((char, y) => {
				if (char !== "") {
					newSubmittedCells.add(x * 10 + y);
				}
			});
		});
		setSubmittedCells(newSubmittedCells);
	}, [grid]);

	const handleCellSubmit = (cellId: number, emoji: string) => {
		const x = Math.floor(cellId / 10);
		const y = cellId % 10;
		handleBlockSubmit({
			roomId,
			x,
			y,
			char: emoji,
		});
		setRestrictionTrigger(Date.now());
	};

	useEffect(() => {
		if (cooldownTime > 0) {
			setRestrictionTrigger(Date.now());
		}
	}, [cooldownTime]);

	const handleTimeTravelClick = (timestamp: number) => {
		handleTimeTravel({ timestamp, roomId });
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
			<div className="mx-auto max-w-[1600px] p-3 sm:p-4 lg:p-6">
				{/* Header */}
				<header className="mb-4 sm:mb-6">
					<div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:p-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-1">
								<h1 className="flex items-center gap-2 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text font-extrabold text-2xl text-transparent sm:text-3xl lg:text-4xl">
									<Sparkles className="h-6 w-6 text-blue-600 sm:h-8 sm:w-8" />
									Emoji Canvas
								</h1>
							</div>
							<div className="flex items-center gap-3">
								<RestrictionTimer
									restrictionSeconds={cooldownTime}
									restrictionTrigger={restrictionTrigger}
									onRestrictionStart={() => console.log("Restriction started")}
									onRestrictionEnd={() => console.log("Restriction ended")}
								/>
								<OnlineBadge count={onlineCount} />
								<Button
									onClick={handleLeaveRoom}
									variant="destructive"
									size="default"
									className="gap-2 shadow-md transition-all hover:scale-105"
								>
									<LogOut className="h-4 w-4" />
									<span className="hidden sm:inline">Leave</span>
								</Button>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
					{/* Grid Section */}
					<div className="lg:col-span-8">
						<EmojiGrid
							grid={gridCells}
							submittedCells={submittedCells}
							handleCellSubmit={handleCellSubmit}
							disabled={hasSubmitted}
						/>
					</div>

					{/* Sidebar */}
					<aside className="space-y-4 lg:col-span-4">
						{/* Cooldown Timer */}

						{/* Players List */}
						<Card className="border-2 border-white/50 bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
									<Users className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
									Players ({players.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="max-h-48 overflow-auto pr-2">
									{players.length === 0 ? (
										<div className="flex h-32 items-center justify-center">
											<p className="text-center text-slate-400 text-sm">
												Waiting for players...
											</p>
										</div>
									) : (
										<ul className="space-y-2">
											{players.map((player) => (
												<li
													key={player.userId}
													className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-linear-to-r from-white to-slate-50/50 p-3 shadow-sm transition-all hover:scale-[1.02] hover:border-purple-200 hover:shadow-md"
												>
													<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-pink-500 font-bold text-sm text-white shadow-md">
														{player.name[0].toUpperCase()}
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate font-semibold text-slate-800 text-sm">
															{player.name}
														</p>
														<p className="text-slate-500 text-xs">Active</p>
													</div>
												</li>
											))}
										</ul>
									)}
								</ScrollArea>
							</CardContent>
						</Card>

						<Card className="border-2 border-white/50 bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base sm:text-lg">
									<History className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
									History ({history.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="max-h-64 overflow-auto pr-2">
									{history.length === 0 ? (
										<div className="flex h-48 items-center justify-center">
											<p className="text-center text-slate-400 text-sm">
												No history yet
											</p>
										</div>
									) : (
										<ul className="space-y-2">
											{history.map((entry, idx) => (
												<li
													key={`${entry.timestamp}-${entry.playerId}-${idx}`}
													className="group"
												>
													<button
														type="button"
														onClick={() =>
															handleTimeTravelClick(entry.timestamp)
														}
														className="fade-in slide-in-from-bottom-2 w-full animate-in rounded-lg border-blue-400 border-l-4 bg-linear-to-r from-blue-50 to-transparent p-3 text-left shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-blue-600 hover:shadow-md"
														style={{ animationDelay: `${idx * FIFTY}ms` }}
													>
														<div className="flex items-start justify-between gap-2">
															<div className="flex-1 space-y-1">
																<div className="flex items-center gap-2">
																	<span className="text-2xl">{entry.char}</span>
																	<span className="font-medium text-slate-700 text-xs">
																		at ({entry.x}, {entry.y})
																	</span>
																</div>
																<div className="flex items-center gap-1 text-slate-500 text-xs">
																	<Clock className="h-3 w-3" />
																	{new Date(
																		entry.timestamp
																	).toLocaleTimeString()}
																</div>
															</div>
															<div className="shrink-0 rounded-md bg-blue-100 px-2 py-1 font-medium text-blue-700 text-xs opacity-0 transition-opacity group-hover:opacity-100">
																Time Travel
															</div>
														</div>
													</button>
												</li>
											))}
										</ul>
									)}
								</ScrollArea>
							</CardContent>
						</Card>
					</aside>
				</div>
			</div>
		</div>
	);
}
