import { useGameSocket } from "@/hooks/use-game-socket";
import { useGameStore } from "@/store/use-game-store";
import { useEffect, useState } from "react";
import { OnlineBadge } from "./online-badge";
import { Button } from "./ui/button";
import { Activity, Clock, Info, LogOut, Users } from "lucide-react";
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
	const { grid, players, onlineCount, hasSubmitted, messages } = useGameStore();
	const { handleBlockSubmit, handleLeaveRoom } = useGameSocket(roomId);
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

	console.log(onlineCount)
	
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

	return (
		<div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-8 rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h1 className="mb-1 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text font-extrabold text-4xl text-transparent">
								Emoji Grid Game
							</h1>
							<p className="flex items-center gap-2 text-slate-600">
								<span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-sm">
									Room: {roomId}
								</span>
							</p>
						</div>
						<div className="flex items-center gap-4">
							<OnlineBadge count={onlineCount} />
							<Button
								onClick={handleLeaveRoom}
								variant="destructive"
								size="lg"
								className="gap-2 shadow-lg"
							>
								<LogOut className="h-4 w-4" />
								Leave Room
							</Button>
						</div>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main Grid */}
					<div className="lg:col-span-2">
						<EmojiGrid
							grid={gridCells}
							submittedCells={submittedCells}
							handleCellSubmit={handleCellSubmit}
							disabled={hasSubmitted}
						/>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Restriction Timer */}
						<Card className="border-2 shadow-xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Clock className="h-5 w-5 text-blue-600" />
									Cooldown Timer
								</CardTitle>
							</CardHeader>
							<CardContent>
								<RestrictionTimer
									restrictionSeconds={60}
									restrictionTrigger={restrictionTrigger}
									onRestrictionStart={() => console.log("Restriction started")}
									onRestrictionEnd={() => console.log("Restriction ended")}
								/>
							</CardContent>
						</Card>

						{/* Players List */}
						<Card className="border-2 shadow-xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Users className="h-5 w-5 text-purple-600" />
									Players ({players.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-48">
									{players.length === 0 ? (
										<p className="text-center text-slate-400 text-sm">
											No other players yet
										</p>
									) : (
										<ul className="space-y-2">
											{players.map((player) => (
												<li
													key={player.userId}
													className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-linear-to-r from-white to-slate-50 p-3 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
												>
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-pink-500 font-bold text-white shadow-md">
														{player.name[0]}
													</div>
													<div>
														<p className="font-semibold text-slate-800">
															{player.name}
														</p>
														<p className="text-slate-500 text-xs">
															Active player
														</p>
													</div>
												</li>
											))}
										</ul>
									)}
								</ScrollArea>
							</CardContent>
						</Card>

						{/* Activity Log */}
						<Card className="border-2 shadow-xl">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Activity className="h-5 w-5 text-green-600" />
									Activity Feed
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-64">
									{messages.length === 0 ? (
										<p className="text-center text-slate-400 text-sm">
											No activity yet
										</p>
									) : (
										<ul className="space-y-2">
											{messages.map((msg, idx) => (
												<li
													// biome-ignore lint/suspicious/noArrayIndexKey: <>
													key={idx}
													className="fade-in slide-in-from-bottom-2 animate-in rounded-lg border-green-400 border-l-4 bg-linear-to-r from-green-50 to-transparent p-3 text-slate-700 text-sm shadow-sm duration-300"
													style={{ animationDelay: `${idx * FIFTY}ms` }}
												>
													{msg}
												</li>
											))}
										</ul>
									)}
								</ScrollArea>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Instructions */}
				<Card className="mt-6 border-2 shadow-xl">
					<CardContent className="pt-6">
						<div className="flex gap-4">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500">
								<Info className="h-6 w-6 text-white" />
							</div>
							<div>
								<h3 className="mb-3 font-bold text-slate-800 text-xl">
									How to Play
								</h3>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-lg bg-linear-to-br from-blue-50 to-indigo-50 p-4">
										<p className="font-semibold text-blue-900 text-sm">
											1. Select a Cell
										</p>
										<p className="text-slate-600 text-xs">
											Click any empty white cell on the grid
										</p>
									</div>
									<div className="rounded-lg bg-linear-to-br from-purple-50 to-pink-50 p-4">
										<p className="font-semibold text-purple-900 text-sm">
											2. Choose Emoji
										</p>
										<p className="text-slate-600 text-xs">
											Pick your favorite emoji from the picker
										</p>
									</div>
									<div className="rounded-lg bg-linear-to-br from-green-50 to-emerald-50 p-4">
										<p className="font-semibold text-green-900 text-sm">
											3. Wait Cooldown
										</p>
										<p className="text-slate-600 text-xs">
											60-second timer before next placement
										</p>
									</div>
									<div className="rounded-lg bg-linear-to-br from-orange-50 to-yellow-50 p-4">
										<p className="font-semibold text-orange-900 text-sm">
											4. Create Art!
										</p>
										<p className="text-slate-600 text-xs">
											Collaborate with others to make patterns
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}