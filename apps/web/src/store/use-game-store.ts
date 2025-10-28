import type { CellUpdate, TimeTravelOutputPayload, User } from "@/types/socket";
import { create } from "zustand";
import { combine } from "zustand/middleware";

const THOUSAND = 1000;

export const useGameStore = create(
	combine(
		{
			grid: Array.from({ length: 10 }, () => new Array(10).fill("")),
			players: [] as User[],
			onlineCount: 0,
			cooldownTime: 0,
			playerId: null as string | null,
			hasSubmitted: false,
			messages: [] as string[],
			history: [] as CellUpdate[],
		},
		(set) => ({
			updateCell: (update: CellUpdate) =>
				set((state) => {
					const nextGrid = [...state.grid];
					nextGrid[update.x][update.y] = update.char;
					return { grid: nextGrid, history: [...state.history, update] };
				}),

			setRoomState: (count: number, players: User[], history: CellUpdate[]) =>
				set({ onlineCount: count, players, history }),

			addPlayer: (player: User) =>
				set((state) => ({
					players: [...state.players, player],
					onlineCount: state.onlineCount + 1,
				})),

			removePlayer: (playerId: string) =>
				set((state) => ({
					players: state.players.filter((p) => p.userId !== playerId),
					onlineCount: Math.max(0, state.onlineCount - 1),
				})),

			setPlayerId: (id: string) => set({ playerId: id }),

			setCooldownTime: (time: number) =>
				set({ cooldownTime: Math.floor(time / THOUSAND) }),

			setHasSubmitted: (flag: boolean) => set({ hasSubmitted: flag }),

			addMessage: (msg: string) =>
				set((state) => ({ messages: [...state.messages, msg] })),

			timeTravel: (payload: TimeTravelOutputPayload) =>
				set(() => ({
					grid: payload.grid,
				})),

			resetGame: () =>
				set({
					grid: Array.from({ length: 10 }, () => new Array(10).fill("")),
					players: [],
					onlineCount: 0,
					cooldownTime: 0,
					playerId: null,
					hasSubmitted: false,
					messages: [],
					history: [],
				}),
		})
	)
);
